package router

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func PostRouter(r *gin.Engine) {
	post := r.Group("/posts")
	post.Use(controllers.AuthMiddleware())

	post.POST("", controllers.AuthMiddlewareShip("create_post", false), controllers.CreatePost)
	post.PUT("/:id", controllers.AuthMiddlewareShip("edit_post", true), controllers.UpdatePost)
	post.DELETE("/:id", controllers.AuthMiddlewareShip("delete_post", true), controllers.DeletePost)
	r.GET("/posts/search", controllers.SearchPosts)

	r.GET("/posts", controllers.GetPosts)
	r.GET("/posts/:id", controllers.GetPostByID)
}
