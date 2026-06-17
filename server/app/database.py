from mongoengine import connect, disconnect
from app.config import get_settings

settings = get_settings()


def init_db():
    """Initialize MongoDB Atlas connection."""
    try:
        # Pass the full SRV URI; MongoEngine/PyMongo will parse all options
        # from the connection string (retryWrites, w=majority, etc.)
        connect(
            host=settings.MONGODB_URI,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=30000,
        )
        print("✓ Connected to MongoDB Atlas")
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        raise


def close_db():
    """Close MongoDB connection."""
    disconnect()


# MongoDB Atlas connection
# MONGODB_URI format: mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
# Get yours from: https://www.mongodb.com/cloud/atlas

