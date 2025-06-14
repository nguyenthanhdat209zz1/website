package main

import (
	"backend/config"
	"backend/controllers"
	"backend/router"

	"github.com/gin-gonic/gin"
)

func main() {
	config.Connect()
	r := gin.Default()
	r.Use(controllers.CorsMiddleware())
	r.POST("/login", controllers.Login)
	r.POST("/register", controllers.Register)
	router.PostRouter(r)
	r.Run(":8081")
}
