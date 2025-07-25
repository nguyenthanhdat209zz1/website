package router

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func CommentRouter(r *gin.Engine) {
	comment := r.Group("/comments")
	comment.Use(controllers.AuthMiddleware())
	comment.POST("", controllers.CreateComment)
	comment.GET("", controllers.GetAllComments)
	comment.DELETE("/:id", controllers.DeleteComment)
	r.GET("/comments/:postId", controllers.GetCommentsByPost)
}
