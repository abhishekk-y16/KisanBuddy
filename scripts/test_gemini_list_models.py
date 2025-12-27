#!/usr/bin/env python3
"""List available models via google-generativeai client to discover which models/methods the key supports."""
import os, sys
try:
    import google.generativeai as genai
except Exception as e:
    print('google-generativeai not installed:', e)
    sys.exit(2)

def run():
    key = os.getenv('GEMINI_API_KEY', '')
    if not key:
        print('GEMINI_API_KEY not set in environment')
        return 3
    genai.configure(api_key=key)
    try:
        # Attempt to call list_models or equivalent
        if hasattr(genai, 'list_models'):
            models = genai.list_models()
            print('models:', models)
            return 0
        # Fallback: attempt to call client API method
        try:
            models = genai.models.list()
            print('models:', models)
            return 0
        except Exception as e:
            print('List models call failed:', e)
            return 4
    except Exception as e:
        print('Model discovery failed:', e)
        return 5

if __name__ == '__main__':
    sys.exit(run())
