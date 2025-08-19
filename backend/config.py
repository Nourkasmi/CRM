from pymongo import mongoClient 

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "portal_cms"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
projects_collection = db["projects"]
files_collection = db["files"]