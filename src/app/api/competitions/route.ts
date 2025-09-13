import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import Competition from '@/lib/models/Competition';
import { connectToDatabase } from '@/lib/database';

export async function POST(req: Request) {
  try {
    console.log('Starting competition creation...');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['organization', 'organizer'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user has an organization ID
    if (!session.user.organizationId) {
      return NextResponse.json({ 
        error: 'No organization found. Please join or create an organization first.' 
      }, { status: 400 });
    }

    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connected successfully');

    const data = await req.json();
    console.log('Received data:', data);

    // Validate required fields
    const requiredFields = [
      'title',
      'description',
      'instructions',
      'category',
      'mode',
      'deadlineToApply',
      'startDate',
      'endDate'
    ];

    console.log('Validating required fields...');
    console.log('Required fields:', requiredFields);
    console.log('Data fields check:', requiredFields.map(field => ({
      field,
      value: data[field],
      exists: !!data[field]
    })));

    const missingFields = requiredFields.filter(field => !data[field]);
    console.log('Missing fields:', missingFields);
    
    if (missingFields.length > 0) {
      console.log('Required fields validation failed');
      return NextResponse.json({
        error: 'Missing required fields',
        details: missingFields.map(field => `${field} is required`)
      }, { status: 400 });
    }

    console.log('Required fields validation passed');

    // Add organization ID from session
    data.organization = session.user.organizationId;
    
    // Add organizer ID if the user is an organizer
    if (session.user.role === 'organizer') {
      data.organizer = session.user.id;
    }

    // Validate dates
    const now = new Date();
    const deadlineToApply = new Date(data.deadlineToApply);
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (deadlineToApply < now) {
      return NextResponse.json({ 
        error: 'Application deadline cannot be in the past',
        details: ['Application deadline cannot be in the past']
      }, { status: 400 });
    }

    if (startDate < deadlineToApply) {
      return NextResponse.json({ 
        error: 'Start date must be after application deadline',
        details: ['Start date must be after application deadline']
      }, { status: 400 });
    }

    if (endDate < startDate) {
      return NextResponse.json({ 
        error: 'End date must be after start date',
        details: ['End date must be after start date']
      }, { status: 400 });
    }

    // Process team size data
    if (data.isTeamEvent) {
      console.log('Processing team event data...');
      console.log('Raw teamSize data:', data.teamSize);
      console.log('teamSize types:', {
        min: typeof data.teamSize?.min,
        max: typeof data.teamSize?.max
      });
      
      // Ensure teamSize exists
      if (!data.teamSize) {
        console.log('No teamSize provided, setting defaults');
        data.teamSize = { min: 1, max: 4 };
      }

      // Convert string values to numbers if needed
      const min = Number(data.teamSize.min);
      const max = Number(data.teamSize.max);

      console.log('Converted values:', { min, max });
      console.log('isNaN check:', { minIsNaN: isNaN(min), maxIsNaN: isNaN(max) });

      // Validate team size values are valid numbers
      if (isNaN(min) || isNaN(max)) {
        console.log('Invalid numbers detected');
        return NextResponse.json({ 
          error: 'Team size values must be valid numbers',
          details: ['Team size values must be valid numbers']
        }, { status: 400 });
      }

      data.teamSize = { min, max };

      console.log('Final teamSize after conversion:', data.teamSize);

      // Validate team size
      if (min < 1) {
        console.log('Minimum team size validation failed:', min);
        return NextResponse.json({ 
          error: 'Minimum team size must be at least 1 for team events',
          details: ['Minimum team size must be at least 1 for team events']
        }, { status: 400 });
      }

      if (max < min) {
        console.log('Maximum team size validation failed:', { min, max });
        return NextResponse.json({ 
          error: 'Maximum team size must be greater than or equal to minimum team size',
          details: ['Maximum team size must be greater than or equal to minimum team size']
        }, { status: 400 });
      }

      console.log('Team size validation passed');
    } else {
      console.log('Not a team event, removing team size data');
      // If not a team event, remove team size data
      delete data.teamSize;
    }

    // Convert registration fee to number
    data.registrationFee = Number(data.registrationFee) || 0;

    // Ensure skillsRequired is an array of strings
    if (data.skillsRequired) {
      if (typeof data.skillsRequired === 'string') {
        data.skillsRequired = data.skillsRequired.split(',').map((skill: string) => skill.trim());
      }
      // Filter out empty strings and invalid values
      data.skillsRequired = data.skillsRequired
        .filter((skill: unknown): skill is string => 
          skill !== null && 
          typeof skill === 'string' && 
          skill.trim().length > 0
        )
        .map((skill: string) => skill.trim());
    } else {
      data.skillsRequired = [];
    }

    // Validate mode and location
    if ((data.mode === 'onsite' || data.mode === 'hybrid') && !data.location) {
      return NextResponse.json({
        error: 'Location is required for onsite or hybrid events',
        details: ['Location is required for onsite or hybrid events']
      }, { status: 400 });
    }

    // Debug log before creation
    console.log('Final data before creation:', {
      isTeamEvent: data.isTeamEvent,
      teamSize: data.teamSize,
      organization: data.organization,
      organizer: data.organizer,
      title: data.title,
      category: data.category,
      mode: data.mode,
      location: data.location,
      registrationFee: data.registrationFee,
      skillsRequired: data.skillsRequired,
      requiredApplicationFields: data.requiredApplicationFields
    });

    // Create competition
    console.log('Creating competition...');
    try {
      const competition = await Competition.create(data);
      console.log('Competition created successfully:', competition);

      return NextResponse.json({ 
        message: 'Competition created successfully',
        competition 
      }, { status: 201 });
    } catch (error: any) {
      console.error('Error creating competition in database:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return NextResponse.json({ 
          error: 'Validation Error',
          details: validationErrors
        }, { status: 400 });
      }

      if (error.code === 11000) {
        return NextResponse.json({ 
          error: 'A competition with this title already exists in your organization',
          details: ['A competition with this title already exists in your organization']
        }, { status: 400 });
      }

      throw error; // Re-throw to be caught by outer catch block
    }

  } catch (error: any) {
    console.error('Error creating competition:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json({ 
      error: error.message || 'Failed to create competition',
      details: [error.message || 'An unexpected error occurred']
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    console.log('=== /api/competitions GET handler called ===');
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const mode = searchParams.get('mode');
    const organizationId = searchParams.get('organizationId');
    
    console.log("session", session);
    console.log("organizationId", organizationId);
    
    // Build query
    const query: any = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (mode) query.mode = mode;

    // If organizationId is provided, filter by it. Otherwise, return all competitions (do not filter by session user's org)
    if (organizationId && organizationId !== 'undefined' && organizationId !== '') {
      query.organization = organizationId;
    }

    console.log('Final competitions query:', query);

    const competitions = await Competition.find(query)
      .populate('organization', 'name logo')
      .populate('organizer', 'name position')
      .sort({ createdAt: -1 });

    return NextResponse.json({ competitions });

  } catch (error: any) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch competitions' 
    }, { status: 500 });
  }
} 