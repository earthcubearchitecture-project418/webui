package search

import "net/http"

func DoThreadSearch(w http.ResponseWriter, r *http.Request) {

	w.Write([]byte("test"))

}
