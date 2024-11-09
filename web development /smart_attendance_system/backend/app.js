// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const JWT_SECRET='secret'

const app = express();

// Advanced Middleware
app.use(cors());
app.use(express.json());
// app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
const MONGO_URI = "mongodb+srv://sajalgarg2006:sajal123@cluster0.urmyxu4.mongodb.net/?retryWrites=true&w=majority";
// MongoDB connection with advanced options
mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to database"))
  .catch(error => console.error("Database connection error:", error));


// Enhanced Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'professor', 'admin'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  photo: { type: String },
  department: String,
  studentId: String,
  enrollmentYear: Number,
  semester: Number,
  contactNumber: String,
  address: String,
  lastLogin: Date,
  isActive: { type: Boolean, default: true },
  deviceTokens: [String], // For push notifications
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  courseCode: { type: String, required: true },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  schedule: [{
    day: String,
    startTime: String,
    endTime: String,
    room: String
  }],
  semester: Number,
  academicYear: String,
  department: String,
  maxStudents: Number,
  syllabus: String,
  isActive: { type: Boolean, default: true },
  attendanceThreshold: { type: Number, default: 75 }, // Minimum attendance percentage required
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  date: { type: Date, default: Date.now },
  startTime: Date,
  endTime: Date,
  attendees: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'absent' },
    entryTime: Date,
    exitTime: Date,
    location: {
      latitude: Number,
      longitude: Number
    },
    verificationMethod: { type: String, enum: ['facial', 'qr', 'manual', 'gps'] },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  isLocked: { type: Boolean, default: false }, // Prevent further modifications
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Notification Schema
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  message: String,
  type: { type: String, enum: ['attendance', 'alert', 'announcement'] },
  read: { type: Boolean, default: false },
  relatedClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  createdAt: { type: Date, default: Date.now }
});

// Leave Application Schema
const leaveApplicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  startDate: Date,
  endDate: Date,
  reason: String,
  documents: [String],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: String,
  createdAt: { type: Date, default: Date.now }
});

// Initialize Models
const User = mongoose.model('User', userSchema);
const Class = mongoose.model('Class', classSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const LeaveApplication = mongoose.model('LeaveApplication', leaveApplicationSchema);

// Utility Functions
const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    // Configure your email service
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html
  });
};

const createNotification = async (recipient, title, message, type, relatedClass) => {
  const notification = new Notification({
    recipient,
    title,
    message,
    type,
    relatedClass
  });
  await notification.save();
};

// Enhanced Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Role-based Authorization Middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    next();
  };
};

// Advanced Routes

// Authentication Routes
app.post('/api/register',  async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const user = new User({
      ...req.body,
      password: hashedPassword,
      photo: req.file ? req.file.path : null
    });
    await user.save();
    
    // Send welcome email
    // await sendEmail(
    //   user.email,
    //   'Welcome to Smart Attendance System',
    //   `<h1>Welcome ${user.name}!</h1><p>Your account has been created successfully.</p>`
    // );
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Login Route
// Login Route
app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
  
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          email: user.email
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  

// View Student Details and Classes
app.get('/api/students/me', authenticateToken, authorize('admin'), async (req, res) => {
    try {
      const student = await User.findById(req.user.id).select('-password');
      const classes = await Class.find({ students: req.user.id });
      
      res.json({ student, classes });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // View Attendance Records
  app.get('/api/students/me/attendance', authenticateToken, authorize('student'), async (req, res) => {
    try {
      const attendance = await Attendance.find({ 'attendees.student': req.user.id }).populate('class');
      
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  


  // View Professor Details and Classes
app.get('/api/professors/me', authenticateToken, authorize('professor'), async (req, res) => {
    try {
      const professor = await User.findById(req.user.id).select('-password');
      const classes = await Class.find({ professor: req.user.id });
      
      res.json({ professor, classes });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Schedule Class
  app.post('/api/professors/schedule-class', authenticateToken, authorize('professor'), async (req, res) => {
    try {
      const newClass = new Class({
        ...req.body,
        professor: req.user.id,
        students: []
      });
      
      await newClass.save();
      res.status(201).json({ message: 'Class scheduled successfully', class: newClass });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Manage Attendance (Mark Attendance for a Class)
  app.post('/api/professors/attendance', authenticateToken, authorize('professor'), async (req, res) => {
    try {
      const { classId, attendees } = req.body;
      const attendance = new Attendance({
        class: classId,
        attendees,
        conductedBy: req.user.id
      });
      
      await attendance.save();
      res.status(201).json({ message: 'Attendance recorded successfully', attendance });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Edit Student Details
app.put('/api/students/me', authenticateToken, authorize('student'), async (req, res) => {
    try {
      const updatedStudent = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select('-password');
      res.json(updatedStudent);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


  // View All Users
app.get('/api/admin/users', authenticateToken, authorize('admin'), async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Edit User (Student/Professor) by Admin
  app.put('/api/admin/users/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
      const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete User (Student/Professor) by Admin
  app.delete('/api/admin/users/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // View All Classes
  app.get('/api/admin/classes', authenticateToken, authorize('admin'), async (req, res) => {
    try {
      const classes = await Class.find().populate('professor students');
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Edit Class by Admin
  app.put('/api/admin/classes/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
      const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('professor students');
      res.json(updatedClass);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete Class by Admin
  app.delete('/api/admin/classes/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
      await Class.findByIdAndDelete(req.params.id);
      res.json({ message: 'Class deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  
// Class Management Routes
app.post('/api/classes/bulk-enroll', authenticateToken, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { classId, studentIds } = req.body;
    const classObj = await Class.findById(classId);
    classObj.students.push(...studentIds);
    await classObj.save();
    
    // Notify enrolled students
    for (const studentId of studentIds) {
      await createNotification(
        studentId,
        'Class Enrollment',
        `You have been enrolled in ${classObj.name}`,
        'announcement',
        classId
      );
    }
    
    res.json({ message: 'Students enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Attendance Routes
app.post('/api/attendance/bulk', authenticateToken, authorize('professor'), async (req, res) => {
  try {
    const { classId, date, attendanceData } = req.body;
    
    // Get face recognition data from external API
    const recognitionData = await fetch('http://localhost:10000/attendance_tracker');
    const faceData = await recognitionData.json();
    
    // Merge manual and face recognition data
    const mergedAttendance = attendanceData.map(record => ({
      ...record,
      verificationMethod: 'facial',
      status: faceData.find(f => f.studentId === record.student)?.present ? 'present' : 'absent'
    }));
    
    const attendance = new Attendance({
      class: classId,
      date,
      attendees: mergedAttendance,
      conductedBy: req.user.id
    });
    
    await attendance.save();
    
    // Send notifications to absent students
    const absentees = mergedAttendance.filter(a => a.status === 'absent');
    for (const absentee of absentees) {
      await createNotification(
        absentee.student,
        'Attendance Alert',
        'You were marked absent in today\'s class',
        'attendance',
        classId
      );
    }
    
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Analytics Routes
app.get('/api/analytics/attendance-summary', authenticateToken, async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    
    const attendanceRecords = await Attendance.find({
      class: classId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('attendees.student');
    
    const summary = {
      totalClasses: attendanceRecords.length,
      studentStats: {},
      averageAttendance: 0
    };
    
    // Calculate detailed statistics
    attendanceRecords.forEach(record => {
      record.attendees.forEach(attendee => {
        if (!summary.studentStats[attendee.student._id]) {
          summary.studentStats[attendee.student._id] = {
            name: attendee.student.name,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          };
        }
        summary.studentStats[attendee.student._id][attendee.status]++;
      });
    });
    
    // Calculate averages
    Object.values(summary.studentStats).forEach(stats => {
      stats.attendancePercentage = (stats.present / summary.totalClasses) * 100;
    });
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave Application Routes
app.post('/api/leave-applications', authenticateToken, authorize('student'), async (req, res) => {
  try {
    const application = new LeaveApplication({
      ...req.body,
      student: req.user.id
    });
    await application.save();
    
    // Notify professor
    const classObj = await Class.findById(req.body.class);
    await createNotification(
      classObj.professor,
      'Leave Application',
      `New leave application from ${req.user.name}`,
      'alert',
      classObj._id
    );
    
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));