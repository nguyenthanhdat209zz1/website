package config

import (
	"backend/models"
	"fmt"
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := "root:123456@tcp(127.0.0.1:3308)/test_be_again?charset=utf8mb4&parseTime=True&loc=Local"
	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Không thể kết nối với db")
	}
	fmt.Println("Đã kết nối với db")
	database.AutoMigrate(&models.Post{})
	DB = database

	database.AutoMigrate(&models.User{})

}
