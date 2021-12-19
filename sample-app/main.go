package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"database/sql"

	_ "github.com/go-sql-driver/mysql"
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, World")
}

func main() {
	DBMS := "mysql"
	USER := os.Getenv("USER")
	PASS := os.Getenv("PASS")
	HOST := os.Getenv("ENDPOINT")
	PORT := "3306"
	DBNAME := os.Getenv("DATABASE")
	Connect := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", USER, PASS, HOST, PORT, DBNAME)
	db, err := sql.Open(DBMS, Connect)
	if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("Open Success!")
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("ALL Success!")
	}
	http.HandleFunc("/", handler)
	http.ListenAndServe(":80", nil)
}
