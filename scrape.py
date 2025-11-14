import urllib.request
import json
import re
from html.parser import HTMLParser

class BroadwayScraper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.shows = []
        self.current_show = {}
        self.collect_data = False
        self.current_tag = ""
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        # Look for show card images with the specific class
        if tag == 'img' and 'showlistpage__show-card-list--image' in attrs_dict.get('class', ''):
            title = attrs_dict.get('alt', '').strip()
            if title:
                self.current_show = {
                    'title': title,
                    'image': '',
                    'description': 'Broadway show - ' + title
                }
                
                # Get the highest quality image from srcset
                srcset = attrs_dict.get('srcset', '')
                if srcset:
                    # Extract all image URLs and widths from srcset
                    images = re.findall(r'(https://imaging\.broadway\.com/images/poster-\d+/w\d+/\d+-\d+\.jpg)\s+(\d+)w', srcset)
                    if images:
                        # Sort by width (largest first) and take the first one
                        images.sort(key=lambda x: int(x[1]), reverse=True)
                        self.current_show['image'] = images[0][0]
                
                # If no srcset, try data-srcset or src
                if not self.current_show['image']:
                    data_srcset = attrs_dict.get('data-srcset', '')
                    if data_srcset:
                        images = re.findall(r'(https://imaging\.broadway\.com/images/poster-\d+/w\d+/\d+-\d+\.jpg)\s+(\d+)w', data_srcset)
                        if images:
                            images.sort(key=lambda x: int(x[1]), reverse=True)
                            self.current_show['image'] = images[0][0]
                
                if not self.current_show['image']:
                    self.current_show['image'] = attrs_dict.get('src', '')
                
                # Add to shows list
                self.shows.append(self.current_show.copy())

def scrape_all_broadway_shows():
    url = "https://www.broadway.com/shows/tickets/?view_all=true"
    
    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
            }
        )
        
        print("Fetching Broadway.com...")
        with urllib.request.urlopen(req, timeout=10) as response:
            html_content = response.read().decode('utf-8')
        
        print("Parsing HTML content...")
        parser = BroadwayScraper()
        parser.feed(html_content)
        
        # Add IDs to shows
        for i, show in enumerate(parser.shows, 1):
            show['id'] = i
        
        return parser.shows
        
    except Exception as e:
        print(f"Error: {e}")
        return []

# Run the scraper
print("Starting Broadway show scraper...")
shows = scrape_all_broadway_shows()

if shows:
    print(f"Successfully scraped {len(shows)} shows!")
    
    # Save to JSON file
    with open('broadway_shows.json', 'w', encoding='utf-8') as f:
        json.dump(shows, f, indent=2, ensure_ascii=False)
    
    print(f"Data saved to 'broadway_shows.json'")
    
    # Display first 5 shows as preview
    print("\nFirst 5 shows preview:")
    print("-" * 50)
    for show in shows[:5]:
        print(f"ID: {show['id']}")
        print(f"Title: {show['title']}")
        print(f"Image: {show['image']}")
        print("-" * 30)
        
    # Show statistics
    unique_titles = len(set(show['title'] for show in shows))
    print(f"\nStatistics:")
    print(f"Total shows found: {len(shows)}")
    print(f"Unique titles: {unique_titles}")
    
else:
    print("No shows were scraped. Trying alternative approach...")
    
    # Alternative approach using regex only
    try:
        req = urllib.request.Request(
            "https://www.broadway.com/shows/tickets/?view_all=true",
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
        
        # Direct regex approach
        show_pattern = r'<img[^>]*alt="([^"]*)"[^>]*class="[^"]*showlistpage__show-card-list--image[^"]*"[^>]*srcset="[^"]*?(https://imaging\.broadway\.com/images/poster-\d+/w\d+/\d+-\d+\.jpg)[^"]*"[^>]*>'
        matches = re.findall(show_pattern, html)
        
        shows = []
        for i, (title, image) in enumerate(matches, 1):
            shows.append({
                "id": i,
                "title": title,
                "description": f"Experience {title} on Broadway",
                "image": image
            })
        
        if shows:
            with open('broadway_shows.json', 'w', encoding='utf-8') as f:
                json.dump(shows, f, indent=2, ensure_ascii=False)
            print(f"Alternative method found {len(shows)} shows!")
        else:
            print("No shows found with alternative method either.")
            
    except Exception as e:
        print(f"Alternative method also failed: {e}")
