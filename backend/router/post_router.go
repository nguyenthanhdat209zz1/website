package router

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func PostRouter(r *gin.Engine) {
	PostGroup := r.Group("/posts")
	{
		PostGroup.POST("/", controllers.CreatePost)
		PostGroup.GET("/", controllers.GetPosts)
		PostGroup.GET("/:id", controllers.GetPostByID)
		PostGroup.PUT("/:id", controllers.UpdatePost)
		PostGroup.DELETE("/:id", controllers.RequireRole("admin"), controllers.DeletePost)
	}
}
