import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import mongoose from 'mongoose';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const connection = await connectToDatabase();
    
    // Check if connection is ready
    const isConnected = mongoose.connection.readyState === 1;
    
    console.log('Database connection status:', {
      readyState: mongoose.connection.readyState,
      isConnected,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    });
    
    if (!isConnected) {
      return NextResponse.json({
        status: 'error',
        message: 'Database not connected',
        readyState: mongoose.connection.readyState,
        details: {
          0: 'disconnected',
          1: 'connected',
          2: 'connecting',
          3: 'disconnecting'
        }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connected successfully',
      readyState: mongoose.connection.readyState,
      connection: {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      }
    });
    
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 