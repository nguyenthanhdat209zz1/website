package config

import (
	"backend/models"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB
var JwtKey []byte

func Connect() {
	// Load biến môi trường từ file .env (chỉ cần khi chạy local)
	_ = godotenv.Load(".env")

	host := os.Getenv("DATABASE_HOST")
	port := os.Getenv("DATABASE_PORT")
	user := os.Getenv("DATABASE_USER")
	pass := os.Getenv("DATABASE_PASSWORD")
	name := os.Getenv("DATABASE_NAME")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, pass, host, port, name)
	fmt.Println("DSN:", dsn) // Thêm dòng này để debug

	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Không thể kết nối với db:", err)
	}
	fmt.Println("Đã kết nối với db thành công")

	JwtKey = []byte(os.Getenv("JWT_SECRET"))

	// Tạo/migrate bảng
	err = database.AutoMigrate(
		&models.Role{},
		&models.Rule{},
		&models.User{},
		&models.Post{},
		&models.Comment{},
		&models.PostView{},
		&models.PostReaction{},
		&models.Question{},
		&models.Answer{},
		&models.AnswerVote{},
	)
	if err != nil {
		log.Fatal("Lỗi khi migrate database:", err)
	}

	// Seed dữ liệu mặc định
	seedRoles(database)

	DB = database
}

func seedRoles(db *gorm.DB) {
	roles := []models.Role{
		{Name: "admin"},
		{Name: "user"},
		{Name: "viewer"},
	}
	for _, r := range roles {
		db.FirstOrCreate(&r, models.Role{Name: r.Name})
	}
}
