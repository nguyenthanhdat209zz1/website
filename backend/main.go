package main

import (
	"backend/config"
	"backend/router"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	config.Connect()
	router.PostRouter(r)

	r.Run(":8081")
}
