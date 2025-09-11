package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

// Tool represents the structure of each item in the JSON array
type Tool struct {
	Name        string   `json:"name"`
	URL         string   `json:"url"`
	Image       string   `json:"image"`
	Title       string   `json:"title"`
	Tags        []string `json:"tags"`
}

func main() {
	// Read input from stdin
	data, err := ioutil.ReadAll(os.Stdin)
	if err != nil {
		fmt.Println("Error reading input:", err)
		os.Exit(1)
	}

	// Parse JSON data
	var tools []Tool
	err = json.Unmarshal(data, &tools)
	if err != nil {
		fmt.Println("Error parsing JSON:", err)
		os.Exit(1)
	}

	// Print the Markdown table header
	fmt.Println("| NAME                  | DESCRIPTION           |")
	fmt.Println("|-----------------------|-----------------------|")

	// Print each tool as a Markdown table row
	for _, tool := range tools {
		fmt.Printf("| [%s](%s) | %s |\n", tool.Name, tool.URL, tool.Title)
	}
}
