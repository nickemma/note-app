package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Note struct {
	ID        primitive.ObjectID `json:"id" bson:"_id"`
	Title     string             `json:"title" bson:"title"`
	Content   string             `json:"content" bson:"content"`
	UserID    int64              `json:"userId" bson:"userId"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
}

type Claims struct {
	Username string `json:"sub"`
	UserID   int64  `json:"userId"`
	jwt.RegisteredClaims
}

var client *mongo.Client
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

func main() {
	var err error
	client, err = mongo.Connect(context.Background(), options.Client().ApplyURI(os.Getenv("MONGO_URI")))
	if err != nil {
		log.Fatal(err)
	}

	r := gin.Default()

	r.Use(rateLimitMiddleware())

	r.GET("/api/notes", getNotes)
	r.GET("/api/notes/:id", getNote)
	r.POST("/api/notes", authMiddleware(), createNote)
	r.PUT("/api/notes/:id", authMiddleware(), updateNote)
	r.DELETE("/api/notes/:id", authMiddleware(), deleteNote)

	r.Run(":8081")
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" || !strings.HasPrefix(tokenString, "Bearer ") {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		tokenString = strings.TrimPrefix(tokenString, "Bearer ")
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(401, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		c.Set("userId", claims.UserID)
		c.Next()
	}
}

func rateLimitMiddleware() gin.HandlerFunc {
	// Simple in-memory rate limiter (for production, use Redis)
	type client struct {
		count     int
		lastReset time.Time
	}
	clients := make(map[string]*client)
	const limit = 100
	const window = time.Minute

	return func(c *gin.Context) {
		ip := c.ClientIP()
		if cl, exists := clients[ip]; exists {
			if time.Since(cl.lastReset) > window {
				cl.count = 0
				cl.lastReset = time.Now()
			}
			if cl.count >= limit {
				c.JSON(429, gin.H{"error": "Rate limit exceeded"})
				c.Abort()
				return
			}
			cl.count++
		} else {
			clients[ip] = &client{count: 1, lastReset: time.Now()}
		}
		c.Next()
	}
}

func getNotes(c *gin.Context) {
	coll := client.Database("notesdb").Collection("notes")
	cursor, err := coll.Find(context.Background(), bson.M{})
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	var notes []Note
	if err = cursor.All(context.Background(), &notes); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, notes)
}

func getNote(c *gin.Context) {
	id, _ := primitive.ObjectIDFromHex(c.Param("id"))
	coll := client.Database("notesdb").Collection("notes")
	var note Note
	err := coll.FindOne(context.Background(), bson.M{"_id": id}).Decode(&note)
	if err != nil {
		c.JSON(404, gin.H{"error": "Note not found"})
		return
	}
	c.JSON(200, note)
}

func createNote(c *gin.Context) {
	var note Note
	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	note.ID = primitive.NewObjectID()
	note.UserID = c.GetInt64("userId")
	note.CreatedAt = time.Now()

	coll := client.Database("notesdb").Collection("notes")
	_, err := coll.InsertOne(context.Background(), note)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, note)
}

func updateNote(c *gin.Context) {
	id, _ := primitive.ObjectIDFromHex(c.Param("id"))
	var note Note
	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	coll := client.Database("notesdb").Collection("notes")
	var existing Note
	err := coll.FindOne(context.Background(), bson.M{"_id": id}).Decode(&existing)
	if err != nil {
		c.JSON(404, gin.H{"error": "Note not found"})
		return
	}

	if existing.UserID != c.GetInt64("userId") {
		c.JSON(403, gin.H{"error": "Unauthorized to edit this note"})
		return
	}

	update := bson.M{"$set": bson.M{"title": note.Title, "content": note.Content}}
	_, err = coll.UpdateOne(context.Background(), bson.M{"_id": id}, update)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Note updated"})
}

func deleteNote(c *gin.Context) {
	id, _ := primitive.ObjectIDFromHex(c.Param("id"))
	coll := client.Database("notesdb").Collection("notes")
	var note Note
	err := coll.FindOne(context.Background(), bson.M{"_id": id}).Decode(&note)
	if err != nil {
		c.JSON(404, gin.H{"error": "Note not found"})
		return
	}

	if note.UserID != c.GetInt64("userId") {
		c.JSON(403, gin.H{"error": "Unauthorized to delete this note"})
		return
	}

	_, err = coll.DeleteOne(context.Background(), bson.M{"_id": id})
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Note deleted"})
}
