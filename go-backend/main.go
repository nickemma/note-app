package main

import (
	"context"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"os"
	"strings"
	"time"
)

type Note struct {
	ID        primitive.ObjectID `json:"id" bson:"_id"`
	Title     string             `json:"title" bson:"title"`
	Content   string             `json:"content" bson:"content"`
	UserID    int64              `json:"userId" bson:"userId"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
}

// Claims Updated Claims structure to match Java's JWT structure
type Claims struct {
	// Sub (subject) will contain the username in Java's JWT
	Username string `json:"sub"`
	// UserId as a top-level claim from Java
	UserID int64 `json:"userId"`
	jwt.RegisteredClaims
}

var client *mongo.Client
var jwtSecret []byte

func main() {
	// Get JWT secret from environment variable
	jwtSecret = []byte(os.Getenv("JWT_SECRET"))

	var err error
	client, err = mongo.Connect(context.Background(), options.Client().ApplyURI(os.Getenv("MONGO_URI")))
	if err != nil {
		log.Fatal(err)
	}

	r := gin.Default()

	// Add CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

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

		// Ensure no extra spaces in the token
		tokenString = strings.TrimSpace(tokenString)

		// For Java-generated JWT tokens, we need a custom approach
		parts := strings.Split(tokenString, ".")
		if len(parts) != 3 {
			c.JSON(401, gin.H{"error": "Invalid token format"})
			c.Abort()
			return
		}

		// Parse token manually using the Manual Parsing Parser
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Check the algorithm
			alg := token.Header["alg"]

			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", alg)
			}
			return jwtSecret, nil
		})

		if err != nil {
			c.JSON(401, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		if !token.Valid {
			c.JSON(401, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Extract claims from the token
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(401, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Get userId from claims
		userIdFloat, ok := claims["userId"].(float64)
		if !ok {
			c.JSON(401, gin.H{"error": "Invalid user ID in token"})
			c.Abort()
			return
		}

		// Set the user ID from the validated token
		c.Set("userId", int64(userIdFloat))
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
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid note ID"})
		return
	}
	coll := client.Database("notesdb").Collection("notes")
	var note Note
	err = coll.FindOne(context.Background(), bson.M{"_id": id}).Decode(&note)
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
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid note ID"})
		return
	}
	var note Note
	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	coll := client.Database("notesdb").Collection("notes")
	var existing Note
	err = coll.FindOne(context.Background(), bson.M{"_id": id}).Decode(&existing)
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
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid note ID"})
		return
	}
	coll := client.Database("notesdb").Collection("notes")
	var note Note
	err = coll.FindOne(context.Background(), bson.M{"_id": id}).Decode(&note)
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
