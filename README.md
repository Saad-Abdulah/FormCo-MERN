# FormCO - Platform for Competitions

> 📸 **Screenshots and Demo**: Visit my [Portfolio](https://saad-dev-portfolio.vercel.app/portfolio) to see FormCO in action!

A comprehensive competition management platform built with modern web technologies. FormCO (platFORM for COmpetitions) provides a complete solution for organizations to create, manage, and host competitions while offering students an intuitive platform to discover and participate in various events.

## 🏗️ Code Structure

```
formco-next/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── competitions/  # Competition management
│   │   │   ├── certificates/  # Certificate generation
│   │   │   └── organization/  # Organization management
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Role-based dashboards
│   │   └── events/            # Event display pages
│   ├── components/            # Reusable UI components
│   │   └── ui/               # Base UI components
│   ├── context/              # React context providers
│   ├── lib/                  # Utility libraries
│   │   ├── models/           # MongoDB schemas
│   │   └── utils/            # Helper functions
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
│   ├── Certificate-Generator/ # Certificate templates
│   ├── Org-Logos/            # Organization logos
│   └── receipts/             # Payment receipts
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **React Icons** - Icon library
- **Headless UI** - Accessible UI components

### Backend
- **Next.js API Routes** - Server-side API
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **NextAuth.js** - Authentication
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing

### Additional Libraries
- **Canvas** - Certificate generation
- **Multer** - File upload handling
- **Nodemailer** - Email functionality
- **SendGrid** - Email service
- **Date-fns** - Date manipulation

## 🗄️ MongoDB Collections

- **Organizations** - Organization profiles and settings
- **Organizers** - Organizer accounts and permissions  
- **Students** - Student user accounts
- **Competitions** - Competition details and configurations
- **Applications** - Student competition applications
- **TeamRegistrations** - Team-based competition registrations
- **TeamMembers** - Individual team member details

## 💡 Inspiration

FormCO addresses common competition management challenges:
- **Fragmented Systems**: Multiple disconnected tools
- **Manual Processes**: Tedious handling of applications and certificates  
- **Limited Accessibility**: Poor user interfaces
- **Scalability Issues**: Difficulty managing multiple competitions

A unified solution that streamlines the entire competition lifecycle.

## 👥 Roles

### Organization
Organizations can create competitions, manage organizers, and generate certificates for participants.

### Organizer
Organizers can create competitions, manage applications, and generate certificates under their organization.

### Student
Students can browse competitions, submit applications, and download participation certificates.

## ✨ Features

### For Organizations 🏢
- **Multi-Competition Management**: Create and manage multiple competitions
- **Brand Customization**: Upload logos and customize branding
- **Organizer Management**: Add and manage multiple organizers
- **Application Tracking**: Real-time application status monitoring
- **Certificate Generation**: Automated certificate creation
- **Payment Integration**: Secure payment processing

### For Organizers 👨‍💼
- **Organization Joining**: Easy process to join organizations
- **Competition Creation**: Create and manage competitions
- **Application Review**: Streamlined review process
- **Team Management**: Handle individual and team registrations
- **Certificate Generation**: Generate certificates for participants

### For Students 🎓
- **Competition Discovery**: Browse and search competitions
- **Flexible Registration**: Individual and team applications
- **Document Upload**: Secure file upload
- **Payment Processing**: Integrated payment system
- **Status Tracking**: Real-time status updates
- **Certificate Access**: Download participation certificates

### Technical Features ⚙️
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live notifications
- **File Management**: Secure upload and storage
- **Email Integration**: Automated notifications
- **Security**: JWT authentication
- **Scalability**: Multi-organization support

## 👨‍💻 Built By

<a href="https://github.com/Saad-Abdulah" target="_blank">🔗 Saad Abdullah</a>

- A passionate developer who envisioned and built FormCO from the ground up.

---

*FormCO - Streamlining competition management for the digital age.*
