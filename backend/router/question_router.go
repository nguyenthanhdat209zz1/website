package router

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func QuestionRouter(r *gin.Engine) {
	q := r.Group("/questions")
	{
		q.GET("", controllers.GetQuestions)
		q.POST("", controllers.AuthMiddleware(), controllers.CreateQuestion)
		q.GET(":id", controllers.GetQuestionDetail)
		q.DELETE(":id", controllers.AuthMiddleware(), controllers.DeleteQuestion)
		q.POST(":id/report", controllers.AuthMiddleware(), controllers.ReportQuestion)
		q.PUT(":id", controllers.AuthMiddleware(), controllers.UpdateQuestion)
	}
	r.POST("/answers", controllers.AuthMiddleware(), controllers.CreateAnswer)
	r.POST("/answers/:id/vote", controllers.AuthMiddleware(), controllers.VoteAnswer)
}
