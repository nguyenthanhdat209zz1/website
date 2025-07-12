package router

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func ReportRouter(r *gin.Engine) {
	report := r.Group("/reports")
	report.Use(controllers.AuthMiddleware())
	report.POST("", controllers.CreateReport)
	report.GET("", controllers.GetAllReports)
}
