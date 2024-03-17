package main

import (
	"log"
	"net/http"
)

var PORT = ":3862"

func main() {
	http.Handle("/", http.FileServer(http.Dir("app/dist")))

	log.Printf("Listening on http://127.0.0.1%s\n", PORT)
	log.Fatal(http.ListenAndServe(PORT, http.DefaultServeMux))
}
