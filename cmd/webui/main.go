package main

import (
	"log"
	"net/http"

	"earthcube.org/Project418/webui/internal/landingpages"
	"earthcube.org/Project418/webui/internal/search"

	"github.com/gorilla/mux"
)

// MyServer struct for mux router
type MyServer struct {
	r *mux.Router
}

func main() {
	searchroute := mux.NewRouter()
	searchroute.HandleFunc("/zeroth", search.DoSearch) // the REAL handler for this URL
	http.Handle("/zeroth", searchroute)

	alpha1route := mux.NewRouter()
	alpha1route.HandleFunc("/alpha", search.Alpha) // the REAL handler for this URL
	http.Handle("/alpha", alpha1route)

	alphasroute := mux.NewRouter()
	alphasroute.HandleFunc("/alphasingle", search.AlphaSingle) // the REAL handler for this URL
	http.Handle("/alphasingle", alphasroute)

	// THIS IS CRAP!!!!  fix this...
	// A one off route for robots...  need to fix this code so the search route is only take when
	// there is a ?q= match...  and all static files addressed by ONE router
	// robotRouter := mux.NewRouter()
	// robotRouter.Path("/robots.txt").Handler(http.ServeFile(http.Dir("./static")))
	// http.Handle("/robots.txt", &MyServer{robotRouter})

	lp := mux.NewRouter()
	lp.HandleFunc("/id/datapackage/{id}", landingpages.LandingPage) // the REAL handler for this URL
	http.Handle("/id/datapackage/", lp)

	dc := mux.NewRouter()
	dc.HandleFunc("/data/catalog", landingpages.Catalog) // the REAL handler for this URL
	http.Handle("/data/", dc)

	dp := mux.NewRouter()
	dp.PathPrefix("/datapackages/").Handler(http.StripPrefix("/datapackages/", http.FileServer(http.Dir("./static/datapackages"))))
	http.Handle("/datapackages/", &MyServer{dp})

	swaggerui := mux.NewRouter()
	swaggerui.PathPrefix("/swagger-ui/").Handler(http.StripPrefix("/swagger-ui/", http.FileServer(http.Dir("./static/swagger-ui"))))
	http.Handle("/swagger-ui/", &MyServer{swaggerui})

	imageRouter := mux.NewRouter()
	imageRouter.PathPrefix("/images/").Handler(http.StripPrefix("/images/", http.FileServer(http.Dir("./static/images"))))
	http.Handle("/images/", &MyServer{imageRouter})

	cssRouter := mux.NewRouter()
	cssRouter.PathPrefix("/css/").Handler(http.StripPrefix("/css/", http.FileServer(http.Dir("./static/css"))))
	http.Handle("/css/", &MyServer{cssRouter})

	jsRouter := mux.NewRouter()
	jsRouter.PathPrefix("/js/").Handler(http.StripPrefix("/js/", http.FileServer(http.Dir("./static/js"))))
	http.Handle("/js/", &MyServer{jsRouter})

	htmlRouter := mux.NewRouter()
	htmlRouter.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("./static/html"))))
	http.Handle("/", &MyServer{htmlRouter})

	// UI router (testing)
	uisRouter := mux.NewRouter()
	uisRouter.PathPrefix("/uis/").Handler(http.StripPrefix("/uis/", http.FileServer(http.Dir("./uis"))))
	http.Handle("/uis/", &MyServer{uisRouter})

	componentRouter := mux.NewRouter()
	componentRouter.PathPrefix("/components/").Handler(http.StripPrefix("/components/", http.FileServer(http.Dir("./static/components"))))
	http.Handle("/components/", &MyServer{componentRouter})

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
