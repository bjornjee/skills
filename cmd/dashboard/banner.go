package main

import (
	"math/rand"
	"strings"
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

// Pixel art colors matching the reference image
var (
	pxBlack      = lipgloss.Color("#000000")
	pxBodyPink   = lipgloss.Color("#FFD5D0")
	pxAccentPink = lipgloss.Color("#E88B8B")
)

// axolotlPixels: 0=empty, 1=black, 2=bodyPink, 3=accentPink
// Traced from 32x32 pixel axolotl reference grid, scaled to 20x18.
var axolotlPixels = [][]int{
	//                    GILLS                              GILLS
	{0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0}, // gill tips
	{0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0},
	{0, 0, 1, 3, 1, 0, 0, 0, 0, 0, 0, 0, 1, 3, 1, 0, 0, 0, 0, 0}, // pink gills
	{0, 1, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 1, 3, 3, 1, 0, 0, 0, 0},
	{1, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 3, 3, 1, 0, 0, 0, 0}, // gills meet head
	//                    HEAD
	{1, 3, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 1, 0, 0, 0, 0, 0}, // head starts
	{0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0},
	{0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0},
	{0, 1, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0}, // eyes
	{0, 0, 1, 2, 3, 2, 2, 2, 3, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0}, // cheeks
	{0, 0, 0, 1, 2, 2, 2, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0}, // mouth
	//                    BODY
	{0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0}, // upper body
	{0, 0, 0, 1, 2, 2, 1, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0}, // body detail
	{0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0}, // body wider
	//                    LEGS + TAIL
	{0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0}, // legs, tail start
	{0, 0, 1, 2, 1, 0, 0, 0, 0, 1, 2, 3, 1, 0, 1, 1, 0, 0, 0, 0}, // feet, tail grows
	{0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 3, 1, 1, 1, 1, 0, 0, 0}, // tail with pink
	{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0}, // tail end
}

var pxColors = map[int]lipgloss.Color{
	1: pxBlack,
	2: pxBodyPink,
	3: pxAccentPink,
}

// renderAxolotl renders the pixel art using half-block characters with true colors.
// Each terminal row encodes 2 pixel rows via ▀ (fg=top, bg=bottom).
func renderAxolotl() string {
	var lines []string
	for y := 0; y < len(axolotlPixels); y += 2 {
		var line strings.Builder
		topRow := axolotlPixels[y]
		var botRow []int
		if y+1 < len(axolotlPixels) {
			botRow = axolotlPixels[y+1]
		}
		for x := 0; x < len(topRow); x++ {
			top := topRow[x]
			bot := 0
			if botRow != nil && x < len(botRow) {
				bot = botRow[x]
			}
			switch {
			case top == 0 && bot == 0:
				line.WriteString(" ")
			case top == 0:
				line.WriteString(lipgloss.NewStyle().Foreground(pxColors[bot]).Render("▄"))
			case bot == 0:
				line.WriteString(lipgloss.NewStyle().Foreground(pxColors[top]).Render("▀"))
			case top == bot:
				line.WriteString(lipgloss.NewStyle().Foreground(pxColors[top]).Render("█"))
			default:
				line.WriteString(lipgloss.NewStyle().
					Foreground(pxColors[top]).
					Background(pxColors[bot]).
					Render("▀"))
			}
		}
		lines = append(lines, line.String())
	}
	return strings.Join(lines, "\n")
}

var greetingStyle = lipgloss.NewStyle().
	Bold(true).
	Foreground(lipgloss.Color("230"))

var quoteStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color("242")).
	Italic(true)

func (m model) renderBanner() string {
	icon := renderAxolotl()
	greet := greetingStyle.Render(greeting(m.nowFunc()))
	q := quoteStyle.Render(m.quote)

	left := lipgloss.JoinHorizontal(lipgloss.Center, "  ", icon, "  ", greet)

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
