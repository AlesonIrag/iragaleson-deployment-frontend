import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-cataloging',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cataloging.component.html',
  styleUrl: './cataloging.component.css'
})
export class CatalogingComponent implements OnInit {
  // Four sections for the cataloging form
  sections = [
    { id: 1, content: '' },
    { id: 2, content: '' },
    { id: 3, content: '' },
    { id: 4, content: '' }
  ];

  // Print preview state
  isPrintPreview = false;
  
  // PDF download modal state
  showPDFModal = false;
  
  // PDF generation state
  isGeneratingPDF = false;

  constructor() { }

  ngOnInit(): void {
  }

  // Update content for a specific section
  updateSectionContent(sectionId: number, content: string): void {
    const section = this.sections.find(s => s.id === sectionId);
    if (section) {
      section.content = content;
    }
  }

  // Print the cataloging form
  async printCatalogingForm(): Promise<void> {
    this.isPrintPreview = true;
    
    // Wait for the preview to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Get the cataloging form element
      const catalogingForm = document.querySelector('.cataloging-form');
      if (catalogingForm) {
        // Use html2canvas to capture the element with higher scale for better print quality
        const canvas = await html2canvas(catalogingForm as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: (catalogingForm as HTMLElement).scrollWidth,
          height: (catalogingForm as HTMLElement).scrollHeight
        });
        
        // Open a new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          // Write the canvas as an image to the new window
          const imgData = canvas.toDataURL('image/png');
          const windowWidth = printWindow.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
          const windowHeight = printWindow.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
          
          // Calculate optimal size for printing
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(windowWidth / imgWidth, windowHeight / imgHeight);
          
          const width = imgWidth * ratio;
          const height = imgHeight * ratio;
          
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Print Cataloging Form</title>
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: white;
                  }
                  img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                  }
                </style>
              </head>
              <body>
                <img src="${imgData}" style="width: ${width}px; height: ${height}px;" />
              </body>
            </html>
          `);
          
          printWindow.document.close();
          printWindow.focus();
          
          // Wait a bit for content to load, then print
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
            this.isPrintPreview = false;
          }, 1000);
        } else {
          // Fallback to traditional print method
          window.print();
          this.isPrintPreview = false;
        }
      } else {
        // Fallback to traditional print method
        window.print();
        this.isPrintPreview = false;
      }
    } catch (error) {
      console.error('Error in enhanced print:', error);
      // Fallback to traditional print method
      window.print();
      this.isPrintPreview = false;
    }
  }

  // Show PDF download confirmation modal
  downloadAsPDF(): void {
    this.showPDFModal = true;
  }

  // Cancel PDF download
  cancelPDFDownload(): void {
    this.showPDFModal = false;
  }

  // Confirm and download as PDF
  async confirmPDFDownload(): Promise<void> {
    this.showPDFModal = false;
    this.isGeneratingPDF = true;
    
    try {
      // Create print preview
      this.isPrintPreview = true;
      
      // Wait for the preview to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the cataloging form element
      const catalogingForm = document.querySelector('.cataloging-form');
      if (catalogingForm) {
        // Use html2canvas to capture the element with higher scale for better quality
        const canvas = await html2canvas(catalogingForm as HTMLElement, {
          scale: 3, // Even higher quality
          useCORS: true,
          logging: false,
          width: (catalogingForm as HTMLElement).scrollWidth,
          height: (catalogingForm as HTMLElement).scrollHeight
        });
        
        // Create PDF in portrait orientation to match your "reverse landscape" requirement
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px'
        });
        
        // Add image to PDF to fill the entire page while maintaining correct text orientation
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Scale the image to fill the entire PDF page while maintaining aspect ratio
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        
        const width = imgWidth * ratio;
        const height = imgHeight * ratio;
        const x = (pdfWidth - width) / 2;
        const y = (pdfHeight - height) / 2;
        
        // Add the image without rotation so text appears correctly
        pdf.addImage(imgData, 'PNG', x, y, width, height);
        
        // Save PDF
        pdf.save('cataloging-form.pdf');
      }
      
      // Clean up
      this.isPrintPreview = false;
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to print method
      this.fallbackToPrint();
    } finally {
      this.isGeneratingPDF = false;
    }
  }
  
  // Fallback to print method if PDF generation fails
  async fallbackToPrint(): Promise<void> {
    this.isPrintPreview = true;
    try {
      // Get the cataloging form element
      const catalogingForm = document.querySelector('.cataloging-form');
      if (catalogingForm) {
        // Use html2canvas to capture the element
        const canvas = await html2canvas(catalogingForm as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: (catalogingForm as HTMLElement).scrollWidth,
          height: (catalogingForm as HTMLElement).scrollHeight
        });
        
        // Open a new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          // Write the canvas as an image to the new window
          const imgData = canvas.toDataURL('image/png');
          const windowWidth = printWindow.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
          const windowHeight = printWindow.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
          
          // Calculate optimal size for printing
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(windowWidth / imgWidth, windowHeight / imgHeight);
          
          const width = imgWidth * ratio;
          const height = imgHeight * ratio;
          
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Print Cataloging Form</title>
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: white;
                  }
                  img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                  }
                </style>
              </head>
              <body>
                <img src="${imgData}" style="width: ${width}px; height: ${height}px;" />
              </body>
            </html>
          `);
          
          printWindow.document.close();
          printWindow.focus();
          
          // Wait a bit for content to load, then print
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
            this.isPrintPreview = false;
          }, 1000);
        } else {
          // Fallback to traditional print method
          window.print();
          this.isPrintPreview = false;
        }
      } else {
        // Fallback to traditional print method
        window.print();
        this.isPrintPreview = false;
      }
    } catch (error) {
      console.error('Error in fallback print:', error);
      // Last resort fallback
      window.print();
      this.isPrintPreview = false;
    }
  }

  // Clear all sections
  clearAllSections(): void {
    this.sections = this.sections.map(section => ({ ...section, content: '' }));
  }

  // Sample data for demonstration
  loadSampleData(): void {
    this.sections[0].content = 'Book Title: The Great Gatsby\\nAuthor: F. Scott Fitzgerald\\nISBN: 978-0-7432-7356-5\\nPublisher: Scribner\\nYear: 1925\\nGenre: Fiction\\nPages: 180\\nLanguage: English';
    
    this.sections[1].content = 'Call Number: PS3517.A45 G7 1925\\nDewey Decimal: 813.52\\nLocation: Fiction Section, Shelf 12\\nFormat: Hardcover\\nCondition: Good\\nAcquisition Date: 2023-05-15\\nPrice: $12.99\\nSource: Book Purchase Fund';
    
    this.sections[2].content = 'Subject Headings:\\n- American Literature\\n- Jazz Age\\n- Social Criticism\\n- Wealth\\n- Love\\n- Morality\\n\\nSummary:\\nA classic American novel set in the summer of 1922 that explores themes of decadence, idealism, and social upheaval.';
    
    this.sections[3].content = 'Classification Notes:\\n- Classic Literature\\n- Required Reading\\n- Available for Circulation\\n\\nCataloging Notes:\\n- Reviewed by: Jane Smith\\n- Date: 2023-05-20\\n- Status: Completed\\n\\nAdditional Tags:\\n#AmericanClassic #Fiction #1920s';
  }
  
  // Format content for print by replacing newlines with <br> tags
  formatContentForPrint(content: string): string {
    return content.replace(/\\n/g, '<br>');
  }
  
  // Get current date for print footer
  getCurrentDate(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}