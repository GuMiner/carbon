# Building
hugo build

# Test Server
hugo server

# Deployment
Automatic! No more custom steps required.

# AI Tooling
Both Claude Code and GitHub Copilot support attaching external LLMs for processing. Both operate reasonably well, depending on the model.

## Tooling Setup 
### Claude Code Setup
```
$env:ANTHROPIC_BASE_URL=http://10.95.1.121:1234
$env:ANTHROPIC_AUTH_TOKEN=lmstudio
claude --model qwen3.6-27b-mtp
```

### GitHub Copilot Setup
```
$env:COPILOT_PROVIDER_BASE_URL="http://10.95.1.121:1234/V1"
$env:COPILOT_MODEL="qwen3.6-27b-mtp"
$env:COPILOT_PROVIDER_MAX_PROMPT_TOKENS=262144
$env:COPILOT_PROVIDER_MAX_OUTPUT_TOKENS=81920
copilot
```

## Model Selection
Generally, the newer models work better with AI tooling, knowing how to call tools and process images (useful for debugging HTML and CSS). Older models either don't support images, or struggle to properly handle tool operations.

Models also need to be large and new enough to accomplish the task at hand. The examples above use [Qwen 3.6 27B MTP](https://huggingface.co/unsloth/Qwen3.6-27B-MTP-GGUF0), which as of May 2026 is only a few weeks old. This takes ~25 GB to run, which is why both of the setup examples use a local, isolated Framework Desktop
> This machine is based on the [AI Max+ 395/Strix Halo](https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html) platform, capable of up to ~90 GB of LLM GPU memory, albeit with slower speeds for anything beyond 32 GB in size. 