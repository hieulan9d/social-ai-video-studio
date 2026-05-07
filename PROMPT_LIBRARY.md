# SOCIAL AI VIDEO STUDIO - Prompt Library

## Purpose

This library contains reusable prompt templates for:

- short-form social ad script generation
- scene planning
- Google Veo prompt generation
- image-to-video and transition workflows
- product consistency control
- hooks and CTAs

Use these templates as starting points. Always adapt them to the project context:

- platform
- target audience
- product type
- duration
- style
- brand tone

## General Script Generation Template

Use for Vietnamese short-form social ads.

```text
Write a Vietnamese short-form social media ad script.

Goal:
- Create a high-conversion script for {platform}
- Duration target: {duration} seconds
- Style: {style}
- Product type: {product_type}
- Target audience: {target_audience}
- Main idea: {idea}

Structure:
1. Hook
2. Problem
3. Solution
4. Product/Service
5. CTA

Requirements:
- Keep it concise and social-first
- Make the hook strong in the first 2-3 seconds
- Use natural spoken Vietnamese
- Optimize for TikTok/Reels/Shorts attention span
- Output structured JSON with title, hook, targetAudience, problem, solution, productService, cta, voiceover
```

## Vertical Ad Templates

### TikTok Product Ads

```text
Write a Vietnamese TikTok product ad script for {product_name}.

Audience: {target_audience}
Duration: {duration} seconds
Style: fast, scroll-stopping, conversion-focused

Script structure:
- Hook that interrupts scrolling
- Pain point or desire
- Product as the answer
- Quick proof or result
- CTA

Tone:
- punchy
- modern
- highly conversational
```

### Ecommerce Ads

```text
Write a Vietnamese ecommerce short-form ad script for {product_name}.

Focus on:
- product benefits
- buying urgency
- easy decision-making
- trust and clarity

Include:
- clear product positioning
- ideal use case
- why this product is better
- CTA to buy now
```

### Beauty Ads

```text
Write a Vietnamese beauty ad script for {product_name}.

Audience:
- women interested in skincare, beauty, self-care

Emphasize:
- appearance improvement
- confidence
- easy routine integration
- premium but believable tone

Avoid:
- medical overclaiming
- unrealistic promises
```

### Healthcare Ads

```text
Write a Vietnamese healthcare ad script for {product_name}.

Audience: {target_audience}
Tone:
- trustworthy
- careful
- informative
- reassuring

Structure:
- symptom or concern hook
- common daily problem
- supportive product/service solution
- trust cue
- CTA

Avoid:
- exaggerated medical claims
- guaranteed cure language
```

### Salon Ads

```text
Write a Vietnamese salon ad script for {service_name}.

Focus on:
- transformation
- confidence
- local trust
- appointment urgency

Angle:
- before/after emotional difference
- premium service experience
- strong CTA for booking
```

### Restaurant Ads

```text
Write a Vietnamese restaurant promo script for {restaurant_name} or {dish_name}.

Focus on:
- craving
- atmosphere
- signature dish appeal
- limited-time offer if relevant

Tone:
- vivid
- sensory
- fast and tempting
```

### Local Business Ads

```text
Write a Vietnamese local business social ad script for {business_name}.

Focus on:
- local relevance
- trust
- convenience
- clear benefit
- direct CTA
```

### AI Virtual KOL Ads

```text
Write a Vietnamese short-form ad script where an AI virtual KOL introduces {product_name}.

Tone:
- confident
- polished
- influencer-style
- persuasive but natural

Include:
- direct-to-camera hook
- product demonstration angle
- social credibility feel
- CTA
```

### Before/After Transformation Ads

```text
Write a Vietnamese transformation ad script for {product_or_service}.

Structure:
- before pain state
- emotional frustration
- transformation reveal
- explanation of solution
- CTA

Tone:
- dramatic but believable
- visual-friendly
```

### Flash Sale Ads

```text
Write a Vietnamese flash sale script for {product_name}.

Focus on:
- urgency
- discount clarity
- short decision window
- CTA to order immediately

Tone:
- energetic
- direct
- high-conversion
```

## Scene Breakdown Template

```text
Break this Vietnamese short-form ad script into cinematic scenes.

Inputs:
- Script: {script_content}
- Platform: {platform}
- Duration target: {duration}
- Style: {style}

Return an array of scenes.

Each scene must include:
- scene_number
- duration_seconds
- visual_description
- camera_angle
- camera_movement
- subject_action
- background
- lighting
- voiceover
- on_screen_text
- notes

Rules:
- Keep total scene duration aligned with target duration
- Make scenes visually strong and easy to render with AI video
- Optimize for short-form social pacing
```

## Veo Prompt Master Template

Use for one scene at a time. Final prompt should be in English.

```text
Create an English cinematic video prompt optimized for Google Veo 3.

Scene context:
- Main subject: {main_subject}
- Environment: {environment}
- Action: {action}
- Camera angle: {camera_angle}
- Camera movement: {camera_movement}
- Lighting: {lighting}
- Mood: {mood}
- Voiceover context: {voiceover}
- On-screen text context: {on_screen_text}
- Style: {style}
- Platform: {platform}

Requirements:
- Keep the prompt cinematic, realistic, and visually coherent
- Emphasize short-form social ad clarity
- Maintain stable subject identity and product consistency
- Output one concise but complete Veo prompt in English

Include:
- main subject
- environment
- action
- camera movement
- lighting
- mood
- realism level
- product consistency instruction
- negative instructions
```

## Veo Cinematic Camera Prompt Fragments

Mix and match as needed.

### Camera Angles

- close-up beauty shot
- hero product close-up
- low-angle confidence shot
- eye-level talking-to-camera shot
- over-the-shoulder lifestyle shot
- macro detail shot of packaging
- top-down product layout shot
- medium shot with direct eye contact

### Camera Movements

- slow cinematic push-in
- handheld social-style tracking shot
- smooth slider move from left to right
- subtle arc shot around the product
- fast punch-in for emphasis
- gentle pull-back reveal
- floating gimbal movement
- static locked shot for product clarity

### Lighting Styles

- soft studio beauty lighting
- bright premium commercial lighting
- warm golden-hour glow
- clean daylight realism
- high-end luxury spotlighting
- moody contrast lighting with crisp highlights

### Mood Descriptors

- premium and aspirational
- trustworthy and calming
- energetic and urgent
- elegant and feminine
- clean and clinical
- delicious and indulgent
- trendy and youthful

### Realism Phrases

- photorealistic commercial video
- realistic human skin texture
- natural facial proportions
- true-to-life product materials
- high-detail packaging fidelity
- premium advertising realism

## Image-to-Video Prompt Templates

### Product Reveal Animation

```text
Animate the uploaded product image into a premium commercial-style short video.

Show:
- subtle cinematic camera movement
- realistic lighting shifts
- elegant product reveal
- stable packaging details
- premium ad atmosphere

Keep the product identical to the source image.
Do not alter label design, logo placement, shape, or color palette.
```

### Talking Character from Image

```text
Animate the uploaded character image into a realistic short social video.

Show:
- natural head movement
- subtle facial animation
- gentle eye contact with the camera
- believable body posture
- premium ad-style framing

Preserve identity, facial proportions, outfit, and brand context.
```

### Lifestyle Product Motion

```text
Transform the uploaded product image into a dynamic lifestyle ad clip.

Add:
- realistic camera motion
- environmental depth
- premium lighting
- product hero emphasis

Preserve packaging consistency exactly.
```

## Start-End Transition Prompt Templates

### Poster to Product Scene

```text
Create a smooth cinematic transition from the start image to the end image.

Requirements:
- visually coherent transformation
- no sudden identity jumps
- premium commercial pacing
- short-form social ad polish

Preserve the same product identity and brand details across the transition.
```

### Before to After Transformation

```text
Create a realistic transition video from the before image to the after image.

Focus on:
- emotional progression
- visual continuity
- believable transformation
- strong ad impact
```

### Empty Scene to Final Offer Scene

```text
Create a transition from a clean opening scene to a final premium product hero scene.

Feel:
- polished
- elegant
- social-ad ready
- visually satisfying
```

## Product Consistency Prompt Templates

Use whenever product image or logo assets exist.

### Generic Product Consistency

```text
Maintain strict product consistency across the entire video.
Preserve the exact packaging shape, proportions, cap style, label layout, logo position, typography placement, brand colors, and material finish.
Do not invent alternate branding, alternate labels, extra packaging elements, or different product geometry.
```

### Beauty Product Consistency

```text
Keep the cosmetic product fully consistent with the reference asset.
Preserve container shape, pump or cap design, label alignment, finish, logo placement, and color palette exactly.
Do not change the bottle silhouette or printed brand details.
```

### Food or Beverage Product Consistency

```text
Preserve the packaging identity exactly, including logo placement, printed label design, container shape, lid form, and product color cues.
Do not alter the brand mark or create fake packaging variants.
```

## Negative Prompt Library

Default negative instructions:

```text
no subtitles, no watermark, no distorted face, no extra fingers, no wrong product label, no random text, no logo changes
```

Extended negative set when needed:

```text
no deformed hands, no broken anatomy, no flickering identity, no duplicated objects, no melted packaging, no unreadable fake branding, no floating accessories, no warped background, no oversaturated skin, no low-resolution artifacts
```

## Social Hook Templates

Use these as script openers and adapt to the niche.

### Generic Hooks

- Ban co dang gap tinh trang nay khong?
- Neu ban van dang lam cach cu, ban dang mat tien moi ngay.
- Day la loi ma rat nhieu nguoi dang mac phai.
- Chi mat vai giay de biet tai sao san pham nay dang duoc chon mua.
- Co mot cach don gian hon de giai quyet van de nay.

### Beauty Hooks

- Da ban dang xam, san, va kem tu nhien?
- Ban co ngai ra duong vi lan da khong deu mau?
- Chi can mot buoc nho, da co the khac biet ro.

### Healthcare Hooks

- Ban co dang bi kho chiu vi tinh trang nay?
- Dung bo qua dau hieu ma co the ban dang xem nhe.
- Neu tinh trang nay lap lai thuong xuyen, day co the la giai phap ho tro phu hop.

### Restaurant Hooks

- Nhin mon nay la da thay doi bung.
- Mon dang duoc khach goi nhieu nhat hom nay day.
- Toi nay an gi? Thu ngay mon nay.

### Flash Sale Hooks

- Gia nay chi co trong hom nay.
- Het khuyen mai la tro ve gia cu ngay.
- Nhanh tay truoc khi don nay chay hang.

## CTA Templates

### Purchase CTAs

- Mua ngay hom nay.
- Dat hang ngay de nhan uu dai.
- Bam mua ngay truoc khi het khuyen mai.
- Inbox ngay de duoc tu van nhanh.

### Booking CTAs

- Dat lich ngay hom nay.
- Nhan uu dai khi dat hen ngay bay gio.
- Lien he ngay de giu cho som nhat.

### Consultation CTAs

- Nhan tin ngay de duoc tu van.
- De lai thong tin de nhan huong dan chi tiet.
- Lien he ngay de chon giai phap phu hop.

## Practical Prompt Assembly Pattern

When building the final Veo prompt, assemble in this order:

1. Subject identity
2. Environment
3. Action
4. Camera angle
5. Camera movement
6. Lighting
7. Mood
8. Realism level
9. Product consistency instruction
10. Negative instructions

Example:

```text
A confident Vietnamese female beauty KOL holds a premium skincare serum in a bright modern vanity environment, speaking directly to camera with natural hand gestures. Slow cinematic push-in, soft studio beauty lighting, elegant and aspirational mood, photorealistic commercial video, realistic skin texture, true-to-life product materials. Maintain strict product consistency across the entire video: preserve exact packaging shape, label layout, logo placement, and brand colors. No subtitles, no watermark, no distorted face, no extra fingers, no wrong product label, no random text, no logo changes.
```
