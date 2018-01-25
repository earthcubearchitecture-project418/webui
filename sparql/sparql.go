package sparql

import (
	"bytes"
	"log"
	"time"

	"github.com/knakk/sparql"
)

const queries = `
# Comments are ignored, except those tagging a query.

# tag: orgInfo
PREFIX schemaorg: <http://schema.org/>
SELECT DISTINCT ?repository ?name ?url ?logo ?description ?contact_name ?contact_email ?contact_url ?contact_role
WHERE {
  {
     ?repository schemaorg:url <{{.URL}}> .
  }
  UNION
  {
     ?repository <http://schema.org/url> "{{.URL}}" .
  }
  ?repository rdf:type <http://schema.org/Organization>   .
  ?repository schemaorg:name ?name .
  ?repository schemaorg:url ?url .
  OPTIONAL { ?repository schemaorg:description ?description . }
  OPTIONAL { ?repository schemaorg:logo [ schemaorg:url ?logo ] . }
  OPTIONAL {
    ?repository schemaorg:contactPoint ?contact .
    ?contact schemaorg:name ?contact_name .
    ?contact schemaorg:email ?contact_email .
    ?contact schemaorg:contactType ?contact_role .
    ?contact schemaorg:url ?contact_url .
  }
}
LIMIT 1

# tag: genDescribe
PREFIX schemaorg: <http://schema.org/> 
DESCRIBE *
WHERE { 
	<{{.URL}}>  ?p ?o .
  }

# tag: description
PREFIX schemaorg: <http://schema.org/> 
SELECT ?description
WHERE { 
    <{{.URL}}> schemaorg:description ?description .
}

# tag: generalInfo
	   SELECT DISTINCT *
	   WHERE {
	     ?s <http://schema.org/url> "{{.URL}}" .
	     optional {?s <http://schema.org/description> ?desc } .
	     optional {?s rdf:type ?type } .
	     ?s ?pred ?obj
	   }
	   LIMIT 1



`

// SPres SPARQL call results
// ?repository ?name ?url ?logo ?description ?contact_name ?contact_email ?contact_url ?contact_role
type SPres struct {
	Repository   string
	Name         string
	URL          string
	Logo         string
	Description  string
	ContactName  string
	ContactEmail string
	ContactURL   string
	ContactRole  string
}

// connector function for the local sparql instance
func getLocalSPARQL() (*sparql.Repo, error) {
	repo, err := sparql.NewRepo("http://geodex.org/blazegraph/namespace/kb/sparql",
		sparql.Timeout(time.Millisecond*15000),
	)
	if err != nil {
		log.Printf("%s\n", err)
	}
	return repo, err
}

func getQuery(tag string) (string, error) {
	f := bytes.NewBufferString(queries)
	bank := sparql.LoadBank(f)
	q, err := bank.Prepare(tag)
	if err != nil {
		log.Printf("%s\n", err)
	}
	return q, err
}

func DescriptionCall(url string) (string, error) {

	repo, err := getLocalSPARQL()

	f := bytes.NewBufferString(queries)
	bank := sparql.LoadBank(f)

	q, err := bank.Prepare("description", struct{ URL string }{url})
	if err != nil {
		log.Printf("%s\n", err)
	}

	res, err := repo.Query(q)
	if err != nil {
		log.Printf("query call: %v\n", err)
		return "", err
	}

	bindingsTest2 := res.Bindings() // map[string][]rdf.Term
	log.Printf("Binding Test %s ", bindingsTest2)

	// This whole aspect seems verbose... there has to be a better Go way to do this check?
	description := "No description available"
	if len(bindingsTest2) > 0 {
		if len(bindingsTest2["description"]) > 0 {
			description = bindingsTest2["description"][0].String()
		}

	}

	return description, err
}

// SPARQLCall calls triple store and returns results
func DoCall(url string) (SPres, error) {
	data := SPres{}

	repo, err := getLocalSPARQL()

	f := bytes.NewBufferString(queries)
	bank := sparql.LoadBank(f)

	q, err := bank.Prepare("orgInfo", struct{ URL string }{url})
	if err != nil {
		log.Printf("%s\n", err)
	}

	res, err := repo.Query(q)
	if err != nil {
		log.Printf("query call: %v\n", err)
		return data, err
	}

	bindingsTest2 := res.Bindings() // map[string][]rdf.Term
	log.Println(bindingsTest2)

	// This whole aspect seems verbose... there has to be a better Go way to do this check?
	data.Description = ""
	if len(bindingsTest2) > 0 {
		data.Repository = bindingsTest2["repository"][0].String()
		if len(bindingsTest2["description"]) > 0 {
			data.Description = bindingsTest2["description"][0].String()
		}
		if len(bindingsTest2["name"]) > 0 {
			data.Name = bindingsTest2["name"][0].String()
		}
		if len(bindingsTest2["url"]) > 0 {
			data.URL = bindingsTest2["url"][0].String()
		}
		if len(bindingsTest2["logo"]) > 0 {
			data.Logo = bindingsTest2["logo"][0].String()
		}
		if len(bindingsTest2["contact_name"]) > 0 {
			data.ContactName = bindingsTest2["contact_name"][0].String()
		}
		if len(bindingsTest2["contact_email"]) > 0 {
			data.ContactEmail = bindingsTest2["contact_email"][0].String()
		}
		if len(bindingsTest2["contact_url"]) > 0 {
			data.ContactURL = bindingsTest2["contact_url"][0].String()
		}
		if len(bindingsTest2["contact_role"]) > 0 {
			data.ContactRole = bindingsTest2["contact_role"][0].String()
		}
	}

	return data, err
}
