import { GoogleGenAI, Modality, Type } from "@google/genai";
import { useCallback } from "react";

const useGeminiService = () => {
  const editImage = useCallback(
    async (
      base64ImagesData: string[],
      mimeTypes: string[],
      prompt: string
    ) => {
      // The API key must be set in the environment variables
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY environment variable not set.");
      }

      const ai = new GoogleGenAI({
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
      });

      const model = "gemini-2.5-flash-image-preview";

        const systemInstruction = `You are an expert photo editor. You will receive one or more images and a text prompt.
        The first image is the primary image to be edited. Any subsequent images are for reference to better understand the subject's consistent facial features and skin tone.
        Your task is to edit the **primary (first) image** according to the prompt.
        CRUCIAL INSTRUCTION: You MUST preserve the subject’s original face, facial features, and natural skin tone as seen across all provided reference images.
        Only modify the background or clothing of the primary image as requested in the prompt. Do not change the person's identity.`;
        
        const imageParts = base64ImagesData.map((data, index) => ({
            inlineData: {
                data: data,
                mimeType: mimeTypes[index],
            },
        }));

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    ...imageParts,
                    { text: prompt },
                ],
            },
            config: {
                systemInstruction: systemInstruction,
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        // Loop through response parts to find the edited image data
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }

        throw new Error('No image data found in the API response.');
    }, []);
    
    const enhanceImage = useCallback(async (base64ImagesData: string[], mimeTypes: string[]): Promise<string> => {
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            throw new Error("VITE_GEMINI_API_KEY environment variable not set.");
        }

        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
        const model = 'gemini-2.5-flash-image-preview';
        
        const systemInstruction = `You are an expert photo retoucher. You will receive one or more images. The first is the primary image to enhance. Any subsequent images are for reference.
        Your task is to subtly enhance and retouch the primary photo.
        - Improve lighting, contrast, and color balance to make the photo more vibrant and visually appealing.
        - Apply gentle, natural sharpening to bring out details without creating harsh edges.
        - Perform minor, professional-grade skin retouching, such as removing small temporary blemishes or softening harsh shadows.
        CRUCIAL INSTRUCTION: You MUST preserve the subject’s original face, facial features, and natural skin tone, using the reference images to ensure consistency. The goal is a natural enhancement, not an artificial transformation. Do not change the person's identity or make them look like a different person.
        The final output should be a high-quality, retouched photograph.`;
        
        const prompt = "Subtly enhance and retouch the primary photo, using the other images as a reference for the subject's appearance.";

        const imageParts = base64ImagesData.map((data, index) => ({
            inlineData: {
                data: data,
                mimeType: mimeTypes[index],
            },
        }));

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [ ...imageParts, { text: prompt } ],
            },
            config: {
                systemInstruction: systemInstruction,
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }

        throw new Error('No image data found in the API response for enhancement.');
    }, []);
    
    const retouchFace = useCallback(async (base64ImageData: string, mimeType: string, retouchPrompt: string): Promise<string> => {
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            throw new Error("VITE_GEMINI_API_KEY environment variable not set.");
        }
    
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
        const model = 'gemini-2.5-flash-image-preview';
    
        const systemInstruction = `You are an expert portrait photo retoucher. You will receive a portrait image and a specific instruction.
        Your task is to apply only the requested retouching effect to the photo.
        - The changes should be subtle, professional, and natural-looking.
        - Do not alter the subject's core facial features, identity, or overall appearance unless specifically asked.
        CRUCIAL INSTRUCTION: You MUST preserve the subject’s original face, facial features, and natural skin tone. The goal is a natural enhancement, not an artificial transformation. Do not change the person's identity or make them look like a different person.
        The final output should be a high-quality, retouched photograph.`;
    
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { data: base64ImageData, mimeType: mimeType } },
                    { text: retouchPrompt },
                ],
            },
            config: {
                systemInstruction: systemInstruction,
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
    
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }
    
        throw new Error('No image data found in the API response for face retouching.');
    }, []);

    const removeObject = useCallback(async (base64ImageData: string, mimeType: string, base64MaskData: string, referenceImagesData: string[] = [], referenceMimeTypes: string[] = []): Promise<string> => {
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            throw new Error("VITE_GEMINI_API_KEY environment variable not set.");
        }

        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
        const model = 'gemini-2.5-flash-image-preview';
        
        const prompt = "Seamlessly remove the object indicated by the white area in the mask. Realistically fill in the background, maintaining the original style, lighting, and shadows of the photo. If other images are provided, use them as a reference for the subject's face and skin tone if the removal affects a person.";

        const imageParts = [
            { inlineData: { data: base64ImageData, mimeType: mimeType } },
            { text: prompt },
            { inlineData: { data: base64MaskData, mimeType: 'image/png' } },
            ...referenceImagesData.map((data, index) => ({
                inlineData: { data, mimeType: referenceMimeTypes[index] }
            }))
        ];


        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: imageParts,
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }

        throw new Error('No image data found in the API response for object removal.');
    }, []);

    const getBackgroundIdeas = useCallback(async (userPrompt: string): Promise<string[]> => {
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            throw new Error("VITE_GEMINI_API_KEY environment variable not set.");
        }
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
        const model = 'gemini-2.5-flash';
        const systemInstruction = `You are a creative assistant for a photo editing application.
    Based on the user's request, generate 4 distinct, vivid, and descriptive prompts for an AI image editor to change the background of a photo.
    Each prompt should be a full sentence and highly descriptive to ensure a beautiful and detailed image generation.
    For example, if the user says 'put me on a beach', you could generate ideas like:
    - 'A serene, golden sand beach at sunset, with gentle turquoise waves lapping at the shore and distant palm trees silhouetted against the colorful sky.'
    - 'A dramatic black sand beach in Iceland with hexagonal basalt columns, misty sea spray, and a moody, overcast sky.'
    Ensure the output is only a JSON array of strings.`;

        const response = await ai.models.generateContent({
            model: model,
            contents: `User prompt: "${userPrompt}"`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: 'A vivid and descriptive background prompt for an AI image editor.'
                    }
                }
            }
        });

        try {
            const jsonText = response.text.trim();
            const ideas = JSON.parse(jsonText);
            if (Array.isArray(ideas) && ideas.every(item => typeof item === 'string')) {
                return ideas;
            }
            throw new Error("Invalid format for background ideas.");
        } catch (e) {
            console.error("Failed to parse background ideas:", response.text);
            throw new Error("Could not parse the background ideas from the AI response.");
        }
    }, []);

    const generatePromptFromImage = useCallback(async (base64ImageData: string, mimeType: string): Promise<string> => {
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            throw new Error("VITE_GEMINI_API_KEY environment variable not set.");
        }
    
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
        const model = 'gemini-2.5-flash';
    
        const systemInstruction = `You are a world-class photography expert. Your task is to analyze an image and generate a single, detailed, and cohesive text prompt that could be used to recreate a similar image with an AI image generator.
        The prompt must describe the following elements in a flowing, descriptive paragraph:
        1.  **Subject & Composition:** Describe the main subject, their posture, expression, and how they are framed in the shot (e.g., rule of thirds, centered).
        2.  **Lighting:** Describe the lighting style (e.g., soft morning light, harsh midday sun, dramatic Rembrandt lighting, moody cinematic lighting), the direction of the light, and its quality (e.g., warm, cool, diffused).
        3.  **Background & Environment:** Detail the background elements, style, and how they contribute to the mood (e.g., bustling city street with bokeh, serene minimalist studio, lush forest).
        4.  **Camera Settings (Estimated):** Estimate the camera settings that would achieve this look. Mention lens type (e.g., wide-angle, 85mm portrait lens), aperture (e.g., wide aperture like f/1.8 for shallow depth of field, narrow aperture like f/11 for deep focus), and any notable camera effects (e.g., lens flare, film grain).
        Combine all these elements into one paragraph. Do not use lists or bullet points. The final output should be only the text prompt itself.`;
    
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    { text: 'Analyze this image and generate a descriptive prompt.' },
                ],
            },
            config: {
                systemInstruction: systemInstruction,
            },
        });
    
        return response.text;
    }, []);

    return { editImage, getBackgroundIdeas, enhanceImage, removeObject, generatePromptFromImage, retouchFace };
};

export { useGeminiService };