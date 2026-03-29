package main

import (
	"math/rand"
	"time"

	"github.com/charmbracelet/lipgloss"
)

var quotes = []string{
	"Simplicity is the ultimate sophistication.",
	"First, solve the problem. Then, write the code.",
	"Code is like humor. When you have to explain it, it's bad.",
	"Make it work, make it right, make it fast.",
	"The best error message is the one that never shows up.",
	"Talk is cheap. Show me the code.",
	"Programs must be written for people to read.",
	"Premature optimization is the root of all evil.",
	"Any fool can write code that a computer can understand.",
	"Deleted code is debugged code.",
	"It works on my machine.",
	"There are only two hard things: cache invalidation and naming things.",
	"The only way to go fast is to go well.",
	"Weeks of coding can save you hours of planning.",
	"A ship in harbor is safe, but that is not what ships are built for.",
}

func randomQuote() string {
	if len(quotes) == 0 {
		return ""
	}
	return quotes[rand.Intn(len(quotes))]
}

func greeting(now time.Time) string {
	hour := now.Hour()
	switch {
	case hour < 12:
		return "Good Morning, Bjorn"
	case hour < 17:
		return "Good Afternoon, Bjorn"
	default:
		return "Good Evening, Bjorn"
	}
}

var axolotlArt = " ▐▌ ▄██████▄ ▐▌\n▐██▌█ ◕  ◕ █▐██▌\n ▀▀  ▀▄▄▄▀  ▀▀\n      █▌▐█"

var axolotlStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color("86")).
	Bold(true).
	MarginLeft(1).
	MarginRight(1)

var greetingStyle = lipgloss.NewStyle().
	Bold(true).
	Foreground(lipgloss.Color("230"))

var quoteStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color("242")).
	Italic(true)

func (m model) renderBanner() string {
	icon := axolotlStyle.Render(axolotlArt)
	greet := greetingStyle.Render(greeting(m.nowFunc()))
	q := quoteStyle.Render(m.quote)

	left := lipgloss.JoinHorizontal(lipgloss.Center, icon, greet)

	leftWidth := lipgloss.Width(left)
	rightWidth := m.width - leftWidth - 2
	if rightWidth < 0 {
		rightWidth = 0
	}

	right := lipgloss.NewStyle().
		Width(rightWidth).
		Align(lipgloss.Right).
		Render(q)

	return lipgloss.JoinHorizontal(lipgloss.Center, left, "  ", right)
}
