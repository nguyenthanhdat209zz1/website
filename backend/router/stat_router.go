package router

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func StatRouter(r *gin.Engine) {
	stat := r.Group("/stats")
	stat.Use(controllers.AuthMiddleware())
	stat.GET("", controllers.GetStats)
	// Route leaderboard không cần auth
	r.GET("/leaderboard", controllers.GetLeaderboard)
}
