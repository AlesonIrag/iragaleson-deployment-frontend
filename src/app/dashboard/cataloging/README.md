# Cataloging Component

## Overview
The Cataloging component provides a digital form divided into 4 equal sections, simulating a landscape-oriented bond paper divided into quarters. This allows librarians to enter cataloging information in a structured format that can be printed for physical records.

## Features
- **4-Section Layout**: Digital representation of a landscape bond paper divided into 4 equal parts
- **Editable Sections**: Each section can contain different types of cataloging information
- **Print Functionality**: One-click printing of the formatted cataloging form
- **Sample Data**: Load demonstration data to see the component in action
- **Clear Function**: Reset all sections to empty
- **Responsive Design**: Works on different screen sizes

## Usage
1. Navigate to the "Cataloging" section in the Library Management sidebar
2. Enter cataloging information in each of the 4 sections:
   - Section 1: Basic book information (title, author, ISBN, etc.)
   - Section 2: Classification and location details
   - Section 3: Subject headings and summary
   - Section 4: Administrative notes and tags
3. Use the "Load Sample Data" button to see an example
4. Click "Print Cataloging Form" to print the formatted document

## Print Output
When printed, the form will:
- Display all 4 sections in a 2x2 grid layout
- Include a header with "Benedicto College Library - Cataloging Form"
- Include a footer with the current date
- Be optimized for standard paper size (Letter/A4)

## Technical Details
- Built as a standalone Angular component
- Uses CSS Grid for layout management
- Implements print-specific styling with `@media print` queries
- Includes responsive design for different screen sizes