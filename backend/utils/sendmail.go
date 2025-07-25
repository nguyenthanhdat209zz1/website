package utils

import (
	"gopkg.in/gomail.v2"
)

func SendMail(to []string, subject, body string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", "your_gmail@gmail.com")
	m.SetHeader("To", to...)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer("smtp.gmail.com", 587, "anhyeuem2009zz@gmail.com", "ehjj zjsd kusu toho")
	return d.DialAndSend(m)
}
