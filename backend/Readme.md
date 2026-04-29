# Backend development project

This is the journey of my backend learning by making project.
-[Model Link](https://app.eraser.io/workspace/dMA2Pwx0WYGTqIf2pcGh)

┌─────────────────────────────────────────────────────────-┐
│                    AUTO-LOGIN PROCESS                    │
├─────────────────────────────────────────────────────────-┤
│                                                          │
│  DAY 1 - FIRST LOGIN                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐│
│  │ User types   │───▶│ Server uses  │───▶│ Creates     ││
│  │ password     │    │ SECRET from  │    │ UNIQUE token ││
│  │              │    │ .env file    │    │ for this user││
│  └──────────────┘    └──────────────┘    └───────┬──────┘│
│                                                   │      │
│                                                   ▼      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐│
│  │ Token saved  │◀───│ Token sent   │◀───│ Token       ││
│  │ in browser   │    │ to frontend  │    │ created      ││
│  │ localStorage │    │              │    │              ││
│  └───────┬──────┘    └──────────────┘    └──────────────┘│
│          │                                               │
│          ▼                                               │
│  DAY 2 - AUTO-LOGIN                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐│
│  │ Browser      │───▶│ Server gets  │───▶│ Verifies    ││
│  │ sends saved  │    │ token from   │    │ using SAME   ││
│  │ token        │    │ request      │    │ SECRET       ││
│  └──────────────┘    └──────────────┘    └───────┬──────┘│
│                                                   │      │
│                                                   ▼      │
│                              ✅ USER AUTO-LOGGED IN!     | 
│                                 "Welcome back, John!"    │
└─────────────────────────────────────────────────────────-┘