import argparse
import json
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
import sys
import os

def setup_model(model_dir, model_size="t5-base"):
    """
    Download and save the T5 model and tokenizer
    """
    try:
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)
        
        print(f"Downloading {model_size} model and tokenizer...")
        tokenizer = T5Tokenizer.from_pretrained(model_size)
        model = T5ForConditionalGeneration.from_pretrained(model_size)
        
        print("Saving model and tokenizer...")
        model.save_pretrained(model_dir)
        tokenizer.save_pretrained(model_dir)
        print("Model setup completed successfully!")
        
    except Exception as e:
        print(f"Error setting up model: {str(e)}", file=sys.stderr)
        sys.exit(1)

def generate_suggestions(text, model_path, max_length=128, num_suggestions=3):
    """
    Generate writing suggestions using the T5 model
    """
    try:
        # Load model and tokenizer
        model = T5ForConditionalGeneration.from_pretrained(model_path)
        tokenizer = T5Tokenizer.from_pretrained(model_path)
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = model.to(device)
        
        # Prepare input
        prompt = f"improve writing: {text}"
        input_ids = tokenizer(prompt, return_tensors="pt").input_ids.to(device)
        
        # Generate multiple suggestions
        outputs = model.generate(
            input_ids,
            max_length=max_length,
            num_return_sequences=num_suggestions,
            num_beams=num_suggestions * 2,
            temperature=0.8,
            no_repeat_ngram_size=2,
            diversity_penalty=0.7,
            early_stopping=True
        )
        
        # Process suggestions
        suggestions = []
        for i, output in enumerate(outputs):
            improved_text = tokenizer.decode(output, skip_special_tokens=True)
            confidence = float(torch.softmax(model.logits, dim=-1).max().item())
            
            suggestion = {
                "id": f"t5_{i}_{hash(improved_text) % 10000}",
                "text": improved_text,
                "type": "STYLE",  # T5 focuses on style improvements
                "category": "T5 Suggestion",
                "confidence": confidence,
                "model": "T5",
                "metadata": {
                    "position": {
                        "start": 0,
                        "end": len(text)
                    },
                    "context": text[:100] + "...",
                    "originalText": text
                },
                "status": "PENDING"
            }
            suggestions.append(suggestion)
        
        return suggestions
        
    except Exception as e:
        print(f"Error during inference: {str(e)}", file=sys.stderr)
        return []

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_dir", type=str, help="Directory to save/load the model")
    parser.add_argument("--model_size", type=str, default="t5-base", help="T5 model size")
    parser.add_argument("--inference", action="store_true", help="Run inference mode")
    parser.add_argument("--input", type=str, help="Input text for inference")
    parser.add_argument("--model_path", type=str, help="Path to saved model for inference")
    
    args = parser.parse_args()
    
    if args.inference:
        if not args.input or not args.model_path:
            print("Error: Both --input and --model_path are required for inference mode", file=sys.stderr)
            sys.exit(1)
        suggestions = generate_suggestions(args.input, args.model_path)
        print(json.dumps(suggestions))
    else:
        if not args.model_dir:
            print("Error: --model_dir is required for setup mode", file=sys.stderr)
            sys.exit(1)
        setup_model(args.model_dir, args.model_size)