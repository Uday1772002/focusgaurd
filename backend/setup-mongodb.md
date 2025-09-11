# MongoDB Setup for Focus Guard Cam

## 🗄️ **MongoDB Installation & Setup**

### **Option 1: Local MongoDB Installation**

#### **Install MongoDB Community Edition:**

**macOS (using Homebrew):**

```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

**Ubuntu/Debian:**

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**

1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. Start MongoDB service from Services

### **Option 2: MongoDB Atlas (Cloud)**

1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update the `MONGODB_URI` in your `.env` file

## 🔧 **Environment Configuration**

### **Create .env file:**

```bash
# Copy the example file
cp env.example .env
```

### **Edit .env file:**

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration (Local)
MONGODB_URI=mongodb://localhost:27017/focus-guard-cam

# MongoDB Configuration (Atlas)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/focus-guard-cam?retryWrites=true&w=majority
```

## 🚀 **Running the Application**

### **1. Start MongoDB (if using local installation):**

```bash
# macOS
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# MongoDB should start automatically as a service
```

### **2. Start the Backend:**

```bash
cd backend
npm start
```

### **3. Start the Frontend:**

```bash
npm run dev
```

## 📊 **Database Structure**

### **Sessions Collection:**

```javascript
{
  _id: ObjectId,
  id: String (unique),
  candidateName: String,
  startTime: Date,
  endTime: Date,
  status: String (active/completed/paused),
  integrityScore: Number,
  events: [ProctoringEvent],
  createdAt: Date,
  updatedAt: Date
}
```

### **Videos Collection:**

```javascript
{
  _id: ObjectId,
  filename: String (unique),
  originalName: String,
  sessionId: String,
  path: String,
  size: Number,
  mimeType: String,
  uploadedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **ProctoringEvent Schema:**

```javascript
{
  id: String,
  type: String (focus_lost/no_face/multiple_faces/phone_detected/notes_detected/device_detected),
  timestamp: Date,
  description: String,
  severity: String (low/medium/high),
  duration: Number
}
```

## 🔍 **Verifying MongoDB Connection**

### **Check if MongoDB is running:**

```bash
# Connect to MongoDB shell
mongosh

# List databases
show dbs

# Use focus-guard-cam database
use focus-guard-cam

# Show collections
show collections

# Exit MongoDB shell
exit
```

### **Test API endpoints:**

```bash
# Health check
curl http://localhost:3001/api/health

# Create a session
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"candidateName": "Test Candidate"}'
```

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **MongoDB not starting:**

   - Check if port 27017 is available
   - Verify MongoDB installation
   - Check logs: `tail -f /var/log/mongodb/mongod.log`

2. **Connection refused:**

   - Ensure MongoDB is running
   - Check connection string in .env file
   - Verify network connectivity (for Atlas)

3. **Authentication failed:**

   - Check username/password in connection string
   - Verify database permissions

4. **Database not found:**
   - MongoDB creates databases automatically when first document is inserted
   - This is normal behavior

## 📈 **Production Considerations**

### **For Production Deployment:**

1. Use MongoDB Atlas or dedicated MongoDB server
2. Set up proper authentication and authorization
3. Configure backup and monitoring
4. Use environment variables for sensitive data
5. Enable SSL/TLS for secure connections

### **Performance Optimization:**

1. Create appropriate indexes
2. Use connection pooling
3. Monitor query performance
4. Set up proper logging and monitoring
