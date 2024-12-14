from PIL import Image, ImageDraw, ImageFilter

# Icon sizes needed
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def create_icon(size):
    # Create a new image with a blue background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions
    padding = size * 0.1
    center = size / 2
    ball_radius = (size - 2 * padding) / 3
    
    # Draw background circle with gradient effect
    for i in range(int(size * 1.2), -1, -1):
        alpha = int(255 * (1 - i / (size * 1.2)))
        draw.ellipse([
            center - i/2,
            center - i/2,
            center + i/2,
            center + i/2
        ], fill=(59, 130, 246, alpha))
    
    # Draw white circle (golf ball)
    ball_shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(ball_shadow)
    shadow_draw.ellipse(
        [
            center - ball_radius + 2,
            center - ball_radius + 2,
            center + ball_radius + 2,
            center + ball_radius + 2
        ],
        fill=(0, 0, 0, 50)
    )
    ball_shadow = ball_shadow.filter(ImageFilter.GaussianBlur(radius=size//30))
    img.paste(ball_shadow, (0, 0), ball_shadow)
    
    # Draw the actual ball
    draw.ellipse(
        [
            center - ball_radius,
            center - ball_radius,
            center + ball_radius,
            center + ball_radius
        ],
        fill='white'
    )
    
    # Add ball pattern
    pattern_radius = ball_radius * 0.8
    for angle in range(0, 360, 45):
        x1 = center + pattern_radius * 0.3 * (angle % 90) / 90
        y1 = center + pattern_radius * 0.3 * (angle % 90) / 90
        draw.arc(
            [
                x1 - pattern_radius,
                y1 - pattern_radius,
                x1 + pattern_radius,
                y1 + pattern_radius
            ],
            angle,
            angle + 30,
            fill='#E5E7EB',
            width=max(1, size // 50)
        )
    
    # Draw distance lines with glow effect
    line_width = max(2, size // 30)
    glow_color = (255, 255, 255, 100)
    
    def draw_glowing_line(start, end):
        # Draw glow
        for i in range(3):
            draw.line([start, end], 
                     fill=glow_color, 
                     width=line_width + (3-i)*2)
        # Draw main line
        draw.line([start, end], 
                 fill='white', 
                 width=line_width)
    
    # Vertical lines
    draw_glowing_line(
        (center, padding), 
        (center, center - ball_radius - padding)
    )
    draw_glowing_line(
        (center, center + ball_radius + padding),
        (center, size - padding)
    )
    
    # Horizontal lines
    draw_glowing_line(
        (padding, center),
        (center - ball_radius - padding, center)
    )
    draw_glowing_line(
        (center + ball_radius + padding, center),
        (size - padding, center)
    )
    
    # Save the icon
    img.save(f'icons/icon-{size}x{size}.png', 'PNG')
    print(f'Generated icon-{size}x{size}.png')

# Generate all icon sizes
for size in SIZES:
    create_icon(size)
