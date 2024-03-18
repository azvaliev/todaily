package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	port := fmt.Sprintf(":%s", os.Getenv("PORT"))
	if len(port) < 2 {
		port = ":3862"
	}

	http.Handle("/", http.FileServer(http.Dir("app/dist")))

	log.Printf("Listening on http://127.0.0.1%s\n", port)
	log.Fatal(http.ListenAndServe(port, http.DefaultServeMux))
}
