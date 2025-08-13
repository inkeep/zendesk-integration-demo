'use client'


import {
  // type ConversationMessage,
  type AIChatFormSettings,
  type InkeepComponentInstance,
  type InkeepJS,
  type InkeepAIChatSettings,
  type InkeepBaseSettings,
} from '@inkeep/cxkit-types'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zE: any
    Inkeep: InkeepJS
  }
}

// styling for the wrapper around the EmbeddedChat component
const styles = `
  #inkeep-embedded-chat {
    height: 100%;
    width: 100%;
  }

  .chat-button {
    z-index: 10;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
  }

  .chat-button-text {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 8px;
  }

  .chat-wrapper {
    position: fixed;
    bottom: 20px;
    right: 20px;
    height: 100%;
    z-index: 10;
    width: 400px;
    max-height: min(540px, calc(100% - 40px));
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border-radius: 6px;
    transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
    opacity: 1;
    transform: translateY(0);
  }

  .chat-wrapper.is-hidden {
    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
  }

  /* mobile styles */
  @media (max-width: 450px) {
    .chat-wrapper {
      width: 100vw;
      max-height: 100vh;
      height: 100%;
      top: 0px;
      left: 0px;
      bottom: 0px;
      right: 0px;
      border-radius: 0px;
    }
  }
  .chat-wrapper-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px 8px 20px;
    background-color: white;
    color: gray;
    position: relative;
    font-size: 14px;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }
  [data-theme="dark"] .chat-wrapper-header{
    background-color: #191919;
  }
  .chat-wrapper-header::after{
    content: '';
    position: absolute;
    left: 0;
    background: linear-gradient(to bottom, white, transparent);
    width: 100%;
    bottom: 0px;
    height: 12px;
    transform: translateY(100%);
    z-index: 1;
    pointer-events: none;
  }
  [data-theme="dark"] .chat-wrapper-header::after{
    background: linear-gradient(to bottom, #191919, transparent);
  }
  .chat-wrapper-close-button {
    cursor: pointer;
    color: gray;
    padding: 4px;
    background-color: transparent;
  }
`

// styling overrides within the Inkeep widget
const styleOverrides = `
.ikp-ai-chat-wrapper{
  max-height: 100% !important;
  height: calc(100% - 40px) !important;
  box-shadow: none !important;
}
.ikp-ai-chat-form__header {
  margin-top: 16px;
}
.ikp-ai-chat-form__close {
  display: none;
}
.ikp-ai-chat-form__description {
  gap: 12px;
  display: flex;
  flex-direction: column;
}
.ikp-ai-chat-form__cancel {
  font-size: 14px;
}
.ikp-ai-chat-form__submit {
  font-size: 14px;
  background-color: #632CA6;
}
.ikp-ai-chat-form__submit:hover:not(:disabled)  {
  background-color: #6d30b7;
}
`

// const summarizeConversation = async (messages: ConversationMessage[],
// ) => {
//   const res = await fetch('/api/summarize', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       messages,
//     }),
//   });

//   if (!res.ok) {
//     throw new Error(await res.text());
//   }

//   return res.json(); // Inkeep’s response JSON
// }

export default function InkeepChat() {
  const EmbeddedChatRef = useRef<InkeepComponentInstance | undefined>(undefined);
  const [isHidden, setIsHidden] = useState(true)
  const toggleChat = () => setIsHidden((h) => !h)

  // support form configuration
  const supportForm: AIChatFormSettings = {
    // heading: "Chat with Support", // optional heading
    description: `We are excited to support you! Chat is best for setup questions, documentation clarification, or minor issues. For complex problems, open a ticket in our Support Portal here: [https://dtdg.co/new-ticket](https://dtdg.co/new-ticket). \n\n In order to better assist you in a timely manner, Datadog Support may initiate a flare from your environment. Flares provide troubleshooting information to our Support team to help you resolve your issue.`,
    fields: [
      {
        _type: 'include_chat_session',
        label: 'By checking this box, you agree to allow the Datadog support team to view your conversation with the AI assistant.',
        defaultValue: true,
        name: 'include_chat_session',
      },
    ],
    buttons: {
      submit: {
        label: "Start live chat",
        onSubmit: async ({ values, conversation }) => {
          window.zE('messenger', 'close');
          setIsHidden(true) // close the inkeep chat

          try {

            const openWidget = () => {
              window.zE('messenger', 'open');
              window.zE('messenger', 'show');
            }

            window.zE('messenger:set', 'conversationFields', [
              {
                id: '43234535824019', // id of the custom field in zendesk, must be named "Inkeep Conversation ID"
                value: conversation?.id || '',
              }
            ], openWidget)
          } catch (error) {
            console.error(error);
          }
        },
      },
      close: {
        action: "return_to_chat",
      },
    },
  }

  // full inkeep configuration
  const chatProps = {
    baseSettings: {
      apiKey: process.env.NEXT_PUBLIC_INKEEP_API_KEY || '',
      organizationDisplayName: 'Datadog',
      primaryBrandColor: '#632CA6',
      theme: {
        styles: [
          {
            key: 'ikp-style-overrides',
            type: 'style',
            value: styleOverrides,
          },
        ],
      },
    } as InkeepBaseSettings,
    aiChatSettings: {
      introMessage: `Hi! \n\n I'm an AI assistant trained on documentation, help articles, and other content. \n\n Ask me anything about \`Datadog\`. \n\n This tool is for general guidance only and is not intended to process confidential or sensitive information. Do not enter any confidential, sensitive, or customer-specific data from your Datadog environment into this chat.`,
      exampleQuestions: [
        "How to send OpenTelemetry data to Datadog?",
        "How to send Notifications to Slack?",
        "How to install the Datadog Agent on cloud instances?"
      ],
      getHelpOptions: [{
        action: {
          type: "open_form",
          formSettings: supportForm
        },
        icon: { builtIn: "IoHelpBuoyOutline" },
        name:
          "Start a live chat"
      }],
      aiAssistantAvatar: 'https://imgix.datadoghq.com/img/dd_logo_n_70x75.png',
    },
  } as InkeepAIChatSettings


  useEffect(() => {
    if (window && window?.Inkeep?.EmbeddedChat) {
      // initialize the inkeep chat once Inkeep is loaded
      EmbeddedChatRef.current = window.Inkeep.EmbeddedChat("#inkeep-embedded-chat", {
        isHidden,
        ...chatProps,
      });
    }
  }, [window && window?.Inkeep]);

  useEffect(() => {
    if (EmbeddedChatRef.current) {
      // if we need to update a prop for the inkeep chat we need to call the update function
      EmbeddedChatRef.current.update({ isHidden });
    }
  }, [isHidden]);



  return (
    <>
      {/* you can move the styles to a separate css file */}
      <style>{styles}</style>
      <div className="page">
        <button type="button" className="chat-button" onClick={() => setIsHidden(false)}>
          <div className="chat-button-text">
            <MessageSquare width={20} height={20} />
            <span>Support</span>
          </div>
        </button>
        <div className={`chat-wrapper ${isHidden ? 'is-hidden' : ''}`}>
          <div className="chat-wrapper-header">
            <div>Ask AI</div>
            <button className="chat-wrapper-close-button" onClick={toggleChat}>
              <X width={16} height={16} />
            </button>
          </div>
          <div id="inkeep-embedded-chat"></div>
        </div>
      </div>
    </>
  )
}
