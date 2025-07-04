package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Delete(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Xoá bài viết thành công",
		"post_id": id,
	})
}
