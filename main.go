package main

import (
	"log"
	"net/http"

	"earthcube.org/Project418/webui/search"

	"github.com/gorilla/mux"
)

// MyServer struct for mux router
type MyServer struct {
	r *mux.Router
}

func main() {
	searchroute := mux.NewRouter()
	// searchroute.HandleFunc("/", search.HoldingPage) // temporary handler for this URL
	searchroute.HandleFunc("/", search.DoSearch) // the REAL handler for this URL
	http.Handle("/", searchroute)

	// THIS IS CRAP.. .  fix this...
	// A one off route for robots...  need to fix this code so the search route is only take when
	// there is a ?q= match...  and all static files addressed by ONE router
	// robotRouter := mux.NewRouter()
	// robotRouter.Path("/robots.txt").Handler(http.ServeFile(http.Dir("./static")))
	// http.Handle("/robots.txt", &MyServer{robotRouter})

	swaggerui := mux.NewRouter()
	swaggerui.PathPrefix("/swagger-ui/").Handler(http.StripPrefix("/swagger-ui/", http.FileServer(http.Dir("./static/swagger-ui"))))
	http.Handle("/swagger-ui/", &MyServer{swaggerui})

	imageRouter := mux.NewRouter()
	imageRouter.PathPrefix("/images/").Handler(http.StripPrefix("/images/", http.FileServer(http.Dir("./static/images"))))
	http.Handle("/images/", &MyServer{imageRouter})

	cssRouter := mux.NewRouter()
	cssRouter.PathPrefix("/css/").Handler(http.StripPrefix("/css/", http.FileServer(http.Dir("./static/css"))))
	http.Handle("/css/", &MyServer{cssRouter})

	htmlRouter := mux.NewRouter()
	htmlRouter.PathPrefix("/html/").Handler(http.StripPrefix("/html/", http.FileServer(http.Dir("./static/html"))))
	http.Handle("/html/", &MyServer{htmlRouter})

	log.Printf("About to listen on 9900. Go to http://127.0.0.1:9900/")

	err := http.ListenAndServe(":9900", nil)
	// http 2.0 http.ListenAndServeTLS(":443", "server.crt", "server.key", nil)
	if err != nil {
		log.Fatal(err)
	}
}

func (s *MyServer) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	rw.Header().Set("Access-Control-Allow-Origin", "*")
	rw.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	rw.Header().Set("Access-Control-Allow-Headers",
		"Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

	// Let the Gorilla work
	s.r.ServeHTTP(rw, req)
}

func addDefaultHeaders(fn http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		fn(w, r)
	}
}
