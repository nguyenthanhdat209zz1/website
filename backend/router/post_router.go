package router

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func PostRouter(r *gin.Engine) {
	r.Use(controllers.CORSMiddleware())

	post := r.Group("/posts")
	post.Use(controllers.AuthMiddleware())

	post.POST("", controllers.AuthMiddlewareShip("create_post", false), controllers.CreatePost)
	post.PUT("/:id", controllers.AuthMiddlewareShip("edit_post", true), controllers.UpdatePost)
	post.DELETE("/:id", controllers.AuthMiddlewareShip("delete_post", true), controllers.DeletePost)
	post.POST("/:id/view", controllers.IncreasePostView)
	post.POST("/:id/reaction", controllers.HandlePostReaction)
	r.GET("/posts/search", controllers.SearchPosts)
	post.GET("/pending", controllers.GetPendingPosts)
	post.POST("/:id/approve", controllers.ApprovePost)
	post.POST("/:id/reject", controllers.RejectPost)

	r.GET("/posts", controllers.GetPosts)
	r.GET("/posts/:id", controllers.GetPostByID)

	r.GET("/users", controllers.GetAllUsers)
	r.DELETE("/users/:id", controllers.DeleteUser)
	r.PUT("/users/:id", controllers.UpdateUser)
}
