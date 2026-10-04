import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('fixtures', exist_ok=True)

def create_image(filename, text_lines, bg_color=(255, 255, 255), text_color=(0, 0, 0)):
    width, height = 800, 500
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    y = 50
    for line in text_lines:
        draw.text((60, y), line, fill=text_color)
        y += 40
    
    img.save(os.path.join('fixtures', filename))
    print(f"Created {filename}")

# 1. Random Laptop Photo (Unrelated text)
create_image(
    'laptop_random.png',
    [
        'Lenovo ThinkPad X1 Carbon Gen 10',
        'Intel Core i7-1260P Processor',
        '16GB LPDDR5 RAM - 512GB SSD',
        'Windows 11 Professional',
        'Model No: 21CB-000DUS',
        'Serial Number: PF3XYZ12'
    ],
    bg_color=(240, 240, 245),
    text_color=(40, 40, 60)
)

# 2. Authentic Death Certificate
create_image(
    'death_certificate_valid.png',
    [
        'MUNICIPAL CORPORATION GREATER MUMBAI',
        'CERTIFICATE OF DEATH',
        'Registration of Births and Deaths Act 1969',
        'Registration No: D-2023-098271',
        'Date of Death: 14/08/2023',
        'Name of Deceased: RAMESH SHARMA',
        'Sex: Male',
        'Place of Death: Lilavati Hospital',
        'Registrar of Births and Deaths'
    ],
    bg_color=(255, 255, 255),
    text_color=(0, 0, 0)
)

# 3. Authentic PAN Card
create_image(
    'pan_card_valid.png',
    [
        'INCOME TAX DEPARTMENT GOVT. OF INDIA',
        'Permanent Account Number',
        'ABCDE1234F',
        'Name: RAHUL KUMAR',
        'Father: RAMESH SHARMA',
        'Date of Birth: 12/04/1985'
    ],
    bg_color=(245, 250, 255),
    text_color=(0, 20, 80)
)

# 4. Authentic Share Certificate with slightly different spelling (RAHUL KUMR)
create_image(
    'share_cert_valid.png',
    [
        'SHARE CERTIFICATE',
        'TATA CONSULTANCY SERVICES LIMITED',
        'Equity Shares of Rs. 1 each',
        'Certificate Number: 849201',
        'Folio Number: 758758575',
        'Name of Shareholder: RAHUL KUMR',
        'Distinctive Numbers: 10001 to 10100',
        'Registered Office: Bombay House, Mumbai'
    ],
    bg_color=(255, 255, 250),
    text_color=(20, 20, 20)
)
