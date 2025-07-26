package main

import (
	"backend/config"
	"backend/controllers"
	"backend/models"
	"backend/router"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func main() {
	config.Connect()
	RunMigration(config.DB)
	config.Rule_Role(config.DB)

	r := gin.Default()

	r.Use(controllers.CORSMiddleware())
	r.POST("/login", controllers.Login)
	r.POST("/register", controllers.Register)

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "API is running s",
		})
	})

	router.PostRouter(r)
	router.CommentRouter(r)
	router.StatRouter(r)
	router.ReportRouter(r)
	router.QuestionRouter(r)
	r.Run(":8081")
}

func RunMigration(db *gorm.DB) {
	db.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Rule{},
		&models.Post{},
		&models.Report{},
		&models.PostView{},
		&models.PostReaction{},
	)
}
