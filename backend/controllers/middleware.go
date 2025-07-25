package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func getTokenFromHeader(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", jwt.ErrSignatureInvalid
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", jwt.ErrSignatureInvalid
	}

	return parts[1], nil
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr, err := getTokenFromHeader(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token không hợp lệ"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return config.JwtKey, nil
		})

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token không hợp lệ"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token không hợp lệ"})
			c.Abort()
			return
		}

		var user models.User
		if err := config.DB.Preload("Role").Where("name = ?", claims["username"]).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Người dùng không tồn tại"})
			c.Abort()
			return
		}
		c.Set("user", user)
		c.Next()
	}
}

func AuthMiddlewareShip(ruleName string, checkOwner bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userInt, exists := c.Get("user")
		if !exists {
			c.JSON(401, gin.H{"error": "Chưa đăng nhập"})
			c.Abort()
			return
		}
		user := userInt.(models.User)
		var role models.Role
		if err := config.DB.Preload("Rules").First(&role, user.RoleID).Error; err != nil {
			c.JSON(500, gin.H{"error": "Lỗi khi kiểm tra quyền (không tìm thấy role)"})
			c.Abort()
			return
		}
		found := false
		for _, rule := range role.Rules {
			if rule.Name == ruleName {
				found = true
				break
			}
		}
		if !found {
			c.JSON(403, gin.H{"error": "Bạn không có quyền thực hiện"})
			c.Abort()
			return
		}
		if checkOwner {
			id := c.Param("id")
			var post models.Post
			if err := config.DB.First(&post, id).Error; err != nil {
				c.JSON(404, gin.H{"error": "Không tìm thấy bài viết"})
				c.Abort()
				return
			}
			if user.Role.Name != "admin" && post.UserID != user.ID {
				c.JSON(403, gin.H{"error": "Bạn không có quyền chỉnh sửa bài viết của người dùng khác"})
				c.Abort()
				return
			}
		}
		c.Next()
	}
}
