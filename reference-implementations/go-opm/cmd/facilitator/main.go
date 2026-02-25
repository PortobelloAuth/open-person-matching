package main

// start an http server that:
//  - obtains network parameters from configuration (and possibly a network source)
//  - monitors routing salt source rotations
//  - accepts routing key registrations with webhook URL for callback
//  - accepts requests with webhook URL for callback

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func hello(w http.ResponseWriter, req *http.Request) {
	fmt.Fprintf(w, "hello\n")
}

func headers(w http.ResponseWriter, req *http.Request) {
	for name, headers := range req.Header {
		for _, h := range headers {
			fmt.Fprintf(w, "%v: %v\n", name, h)
		}
	}
}

func main() {
	// Create our mux (request router)
	mux := http.NewServeMux()
	mux.HandleFunc("/hello", hello)
	mux.HandleFunc("/headers", headers)

	// Create a server instance.
	srv := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	// Create a channel to listen for OS signals.
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM) // Listen for Ctrl+C and termination signals.

	// Start the server in a separate goroutine.
	go func() {
		log.Printf("HTTP server listening on %s\n", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// Wait for an interrupt signal.
	<-stop // Block main goroutine until a signal is received.
	log.Println("\nShutting down server...")

	// Initiate graceful shutdown with a timeout context.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel() // Release resources sooner if shutdown completes before timeout.

	if err := srv.Shutdown(ctx); err != nil {
		// Handle errors that occurred during shutdown (e.g., context timeout).
		log.Fatalf("Server Shutdown Failed:%+v", err)
	}

	log.Println("Server gracefully stopped.")
}
