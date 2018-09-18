define({ "api": [
  {
    "type": "post",
    "url": "/account/change-password",
    "title": "Change Password",
    "group": "AccountSettings",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required user id</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "curr_password",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "new_password",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "confirm_new_password",
            "description": "<p>optional</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/account.js",
    "groupTitle": "AccountSettings",
    "name": "PostAccountChangePassword"
  },
  {
    "type": "post",
    "url": "/account/doctor-app/notification-setting",
    "title": "Change notification settings for doctor app",
    "group": "AccountSettings",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required id in doctor_profiles table</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "type",
            "description": "<p>required ('available_for_consult' || 'freeqa_notification' || 'chat_notification' || 'feedback_notification' || 'all') any one of them</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "value",
            "description": "<p>value to be updated(0, 1)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/account.js",
    "groupTitle": "AccountSettings",
    "name": "PostAccountDoctorAppNotificationSetting"
  },
  {
    "type": "post",
    "url": "/account/doctor-app/settings",
    "title": "Read doctor settings for app",
    "group": "AccountSettings",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required id in doctor_profiles table</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/account.js",
    "groupTitle": "AccountSettings",
    "name": "PostAccountDoctorAppSettings"
  },
  {
    "type": "post",
    "url": "/account/save",
    "title": "Update account details",
    "group": "AccountSettings",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required user id</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "email",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "mobile",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/account.js",
    "groupTitle": "AccountSettings",
    "name": "PostAccountSave"
  },
  {
    "type": "post",
    "url": "/account/update-email",
    "title": "Update account email",
    "group": "AccountSettings",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required user id</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "email",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "verificationUrl",
            "description": "<p>required http://www.hostname.com/email-verification/</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/account.js",
    "groupTitle": "AccountSettings",
    "name": "PostAccountUpdateEmail"
  },
  {
    "type": "post",
    "url": "/account/update-mobile",
    "title": "Update account mobile",
    "group": "AccountSettings",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required user id</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "mobile",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "phone_code",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "otp",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/account.js",
    "groupTitle": "AccountSettings",
    "name": "PostAccountUpdateMobile"
  },
  {
    "type": "post",
    "url": "/article/detail",
    "title": "Get article detail",
    "name": "Article_View",
    "group": "Article",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is article id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required userId</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/article.js",
    "groupTitle": "Article"
  },
  {
    "type": "post",
    "url": "/article/starred-action",
    "title": "Mark/unmark article as starred",
    "name": "Starred_action",
    "group": "Article",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "favourite",
            "description": "<p>required (true/false)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "articleId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>true.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Updated succesfully.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/article.js",
    "groupTitle": "Article"
  },
  {
    "type": "post",
    "url": "/article/starred-articles",
    "title": "Get list of starred articles",
    "name": "Starred_articles_list",
    "group": "Article",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "pageNo",
            "description": "<p>page number for pagination (optional)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "limit",
            "description": "<p>data limit (optional)</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>true.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>String.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data",
            "description": "<p>An array of articles.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/article.js",
    "groupTitle": "Article"
  },
  {
    "type": "post",
    "url": "/admin/tag/articleTagList",
    "title": "Get article tags",
    "name": "articleTagList",
    "group": "Article",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is tagtypeId</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/tag.js",
    "groupTitle": "Article"
  },
  {
    "type": "post",
    "url": "/admin/tag/articleTagList",
    "title": "Get article tags",
    "name": "articleTagList",
    "group": "Article",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is tagtypeId</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/category.js",
    "groupTitle": "Article"
  },
  {
    "type": "post",
    "url": "/admin/tag/articleTagList",
    "title": "Get article tags",
    "name": "articleTagList",
    "group": "Article",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is tagtypeId</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/medicine.js",
    "groupTitle": "Article"
  },
  {
    "type": "post",
    "url": "/article/like",
    "title": "Like Unlike article",
    "name": "like",
    "group": "Article",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "articleId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>true.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Updated succesfully.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/article.js",
    "groupTitle": "Article"
  },
  {
    "type": "post",
    "url": "/article/list",
    "title": "Get articles list",
    "name": "list",
    "group": "Article",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required userId</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "pageNo",
            "description": "<p>page number for pagination (optional)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "limit",
            "description": "<p>data limit (optional)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctor_id",
            "description": "<p>(optional)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/article.js",
    "groupTitle": "Article"
  },
  {
    "type": "post",
    "url": "/article/most_like_article",
    "title": "Most liked article",
    "name": "most_like_article",
    "group": "Article",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/article.js",
    "groupTitle": "Article"
  },
  {
    "type": "post",
    "url": "/chat/add",
    "title": "Add new chat consult",
    "group": "ChatConsult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "age",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "gender",
            "description": "<p>required (0-&gt;male or 1-&gt;female)</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "contact",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "title",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "description",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "image",
            "description": "<p>optional</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/chat.js",
    "groupTitle": "ChatConsult",
    "name": "PostChatAdd"
  },
  {
    "type": "post",
    "url": "/chat/consult",
    "title": "Get chat consult",
    "group": "ChatConsult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/chat.js",
    "groupTitle": "ChatConsult",
    "name": "PostChatConsult"
  },
  {
    "type": "post",
    "url": "/chat/doctors",
    "title": "Get list of doctors for chat",
    "group": "ChatConsult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "problemtypeTagId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/chat.js",
    "groupTitle": "ChatConsult",
    "name": "PostChatDoctors"
  },
  {
    "type": "post",
    "url": "/chat/file",
    "title": "Upload image for chat",
    "group": "ChatConsult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "uid",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "file",
            "optional": false,
            "field": "image",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/chat.js",
    "groupTitle": "ChatConsult",
    "name": "PostChatFile"
  },
  {
    "type": "post",
    "url": "/chat/list",
    "title": "Get chat consults",
    "group": "ChatConsult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/chat.js",
    "groupTitle": "ChatConsult",
    "name": "PostChatList"
  },
  {
    "type": "post",
    "url": "/chat/messages",
    "title": "Get chat consult message",
    "group": "ChatConsult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "chatconsultId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/chat.js",
    "groupTitle": "ChatConsult",
    "name": "PostChatMessages"
  },
  {
    "type": "post",
    "url": "/chat/messages-pagination",
    "title": "Get chat consult message",
    "group": "ChatConsult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "chatconsultId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "limit",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "offset",
            "optional": false,
            "field": "offset",
            "description": "<p>optional</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Obeject[]",
            "optional": false,
            "field": "data",
            "description": "<p>messages</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "count",
            "description": "<p>number of total messages</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/chat.js",
    "groupTitle": "ChatConsult",
    "name": "PostChatMessagesPagination"
  },
  {
    "type": "post",
    "url": "/chat/tags",
    "title": "Get list of problem type tags for chat",
    "group": "ChatConsult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>optional</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/chat.js",
    "groupTitle": "ChatConsult",
    "name": "PostChatTags"
  },
  {
    "type": "post",
    "url": "/admin/transaction/checkout",
    "title": "Chat payment checkout",
    "name": "Chat_payment_checkout",
    "group": "Chat_Payment",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "chatconsultId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "amount",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "nonce",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/transaction.js",
    "groupTitle": "Chat_Payment"
  },
  {
    "type": "post",
    "url": "/admin/transaction/client_token",
    "title": "Client Token",
    "name": "Client_Token",
    "group": "Chat_Payment",
    "version": "0.0.0",
    "filename": "routes/admin/transaction.js",
    "groupTitle": "Chat_Payment"
  },
  {
    "type": "post",
    "url": "/admin/city/cityList",
    "title": "get city list",
    "name": "cityList",
    "group": "City",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "title",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "page",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/city.js",
    "groupTitle": "City"
  },
  {
    "type": "post",
    "url": "/logout",
    "title": "Logout user",
    "name": "Logout",
    "group": "Common",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "device_id",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Common"
  },
  {
    "type": "post",
    "url": "/device_id",
    "title": "update device id",
    "name": "Update_device_id",
    "group": "Common",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "device_id",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Common"
  },
  {
    "type": "post",
    "url": "/city/list",
    "title": "list all cities by state id",
    "name": "listCity",
    "group": "Common_Api",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "stateId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Common_Api"
  },
  {
    "type": "post",
    "url": "/country/list",
    "title": "list all countries",
    "name": "listCountry",
    "group": "Common_Api",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Common_Api"
  },
  {
    "type": "post",
    "url": "/state/list",
    "title": "list all states by country id",
    "name": "listState",
    "group": "Common_Api",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "countryId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Common_Api"
  },
  {
    "type": "post",
    "url": "/doctor/cancel-claim-request",
    "title": "Cancle claim request by doctor",
    "name": "API_for_cancel_profile_claim_request_by_doctor",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required userId</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required doctorProfileId</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/freeqa/mark-helpful",
    "title": "Mark helpful answer",
    "name": "Mark_helpful_answer",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "questionanswerId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "is_helpful",
            "description": "<p>required 0 =&gt; No, 1 =&gt; Yes</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/freeqa.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/freeqa/skipquestion",
    "title": "doctor skip question",
    "name": "Skip_Question",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientquestionId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/freeqa.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/freeqa/answered-list",
    "title": "doctor answered questions list",
    "name": "doctor_answered_questions_list",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/freeqa.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/onlineconsult",
    "title": "doctor online consult",
    "name": "doctor_online_consult",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/onlineconsult.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/onlineconsult/getStart",
    "title": "doctor online consult get start",
    "name": "doctor_online_consult_get_start",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "available_for_consult",
            "description": "<p>required 1=&gt;Enable, 0=&gt;Disable</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/onlineconsult.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/freeqa?showlist=new|answered&tagId=all|ProblamTagId",
    "title": "doctor questions list",
    "name": "freeqa",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/freeqa.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/onlineconsult/editSetting",
    "title": "online consult edit setting",
    "name": "online_consult_edit_setting",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/onlineconsult.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/onlineconsult/notificationFreeQA",
    "title": "online consult notification Free QA's",
    "name": "online_consult_notification_Free_QA_s",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "freeqa_notification",
            "description": "<p>required 1=&gt;Enable, 0=&gt;Disable</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/onlineconsult.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/onlineconsult/saveSetting",
    "title": "online consult save setting",
    "name": "online_consult_save_setting",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "available_for_consult",
            "description": "<p>required 1=&gt;Enable, 0=&gt;Disable</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "freeqa_notification",
            "description": "<p>required 1=&gt;Enable, 0=&gt;Disable</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "chat_notification",
            "description": "<p>required 1=&gt;Enable, 0=&gt;Disable</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "account_holder_name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "account_number",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "account_type",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "bank_name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "bank_branch_city",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "bank_ifsc_code",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "number",
            "optional": false,
            "field": "consultation_fee",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/onlineconsult.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/freeqa/question",
    "title": "question details",
    "name": "question_details",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/freeqa.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/freeqa/reportQuestion",
    "title": "report about question",
    "name": "report_about_question",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientquestionId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "type",
            "description": "<p>required 1=&gt;Mark Abusive, 2=&gt;Mark Irrelevant, 3=&gt;Mark Fake</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/freeqa.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/freeqa/saveAnswer",
    "title": "save answer",
    "name": "save_answer",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientquestionId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "answer",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "is_for_profile",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/freeqa.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor/freeqa/view-question",
    "title": "question details",
    "name": "view_question_details",
    "group": "Doctor_Consult",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/freeqa.js",
    "groupTitle": "Doctor_Consult"
  },
  {
    "type": "post",
    "url": "/doctor_feedbacks/create",
    "title": "Add feedback for doctor",
    "name": "create",
    "group": "Doctor_Feedback",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "hospitalId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "rating",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "feedback",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor_feedbacks.js",
    "groupTitle": "Doctor_Feedback"
  },
  {
    "type": "post",
    "url": "/doctor_feedbacks/create",
    "title": "Add feedback for doctor",
    "name": "create",
    "group": "Doctor_Feedback",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "hospitalId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "rating",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "feedback",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcarefeedback.js",
    "groupTitle": "Doctor_Feedback"
  },
  {
    "type": "post",
    "url": "/doctor_feedbacks/list",
    "title": "Get All doctor feedbacks",
    "name": "list",
    "group": "Doctor_Feedback",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor_feedbacks.js",
    "groupTitle": "Doctor_Feedback"
  },
  {
    "type": "post",
    "url": "/doctor_feedbacks/list",
    "title": "Get All doctor feedbacks",
    "name": "list",
    "group": "Doctor_Feedback",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcarefeedback.js",
    "groupTitle": "Doctor_Feedback"
  },
  {
    "type": "post",
    "url": "/doctor/myschedule/add-block",
    "title": "Block Schedule",
    "group": "Doctor_Schedule",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "hospitalDoctorId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "YYYY-MM-DD",
            "optional": false,
            "field": "from_date",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "YYYY-MM-DD",
            "optional": false,
            "field": "to_date",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "leave_details",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/myschedule.js",
    "groupTitle": "Doctor_Schedule",
    "name": "PostDoctorMyscheduleAddBlock"
  },
  {
    "type": "post",
    "url": "/doctor/myschedule/add-block",
    "title": "Block Schedule",
    "group": "Doctor_Schedule",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "hospitalDoctorId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "YYYY-MM-DD",
            "optional": false,
            "field": "from_date",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "YYYY-MM-DD",
            "optional": false,
            "field": "to_date",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "leave_details",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcaremyschedule.js",
    "groupTitle": "Doctor_Schedule",
    "name": "PostDoctorMyscheduleAddBlock"
  },
  {
    "type": "post",
    "url": "/doctor/myschedule/status",
    "title": "Change Schedule status",
    "group": "Doctor_Schedule",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "sid",
            "optional": false,
            "field": "id",
            "description": "<p>required ScheduleId</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "suggestion",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "status",
            "optional": false,
            "field": "status",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/myschedule.js",
    "groupTitle": "Doctor_Schedule",
    "name": "PostDoctorMyscheduleStatus"
  },
  {
    "type": "post",
    "url": "/doctor/myschedule/status",
    "title": "Change Schedule status",
    "group": "Doctor_Schedule",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "sid",
            "optional": false,
            "field": "id",
            "description": "<p>required ScheduleId</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "suggestion",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "status",
            "optional": false,
            "field": "status",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcaremyschedule.js",
    "groupTitle": "Doctor_Schedule",
    "name": "PostDoctorMyscheduleStatus"
  },
  {
    "type": "post",
    "url": "/doctor/add-hospital-timing",
    "title": "Add hospital timings",
    "name": "add_hospital_timing",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "hospitalId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/add-hospital-timing",
    "title": "Add hospital timings",
    "name": "add_hospital_timing",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "hospitalId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/article/get-detail",
    "title": "Get article detail",
    "name": "article_detail_api_for_doctor_app",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required Article ID</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/article.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/article/get-list",
    "title": "Get articles list",
    "name": "article_list_api_for_doctor_app",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required doctorProfileId</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "patientId",
            "description": "<p>(required for patient app)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "pageNo",
            "description": "<p>page number for pagination (optional)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "limit",
            "description": "<p>data limit (optional)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/article.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/claim-profile-api",
    "title": "Claimed Profile data",
    "name": "claim_profile_api",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/claim-profile-api",
    "title": "Claimed Profile data",
    "name": "claim_profile_api",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/create-tag",
    "title": "add custom tag",
    "name": "create_tag",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "tagtypeId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "title",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "languageId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/create-tag",
    "title": "add custom tag",
    "name": "create_tag",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "tagtypeId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "title",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "languageId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/deleteEducationRecord",
    "title": "delete Education details",
    "name": "deleteEducationRecord",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctor_edu_id",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/doctorByDoctorId",
    "title": "Get doctor profile view for doctor app",
    "name": "doctorByDoctorId",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is doctorprofile id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/doctorByDoctorId",
    "title": "Get doctor profile view for doctor app",
    "name": "doctorByDoctorId",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is doctorprofile id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/doctorById",
    "title": "Get doctor profile",
    "name": "doctorById",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is doctor id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/doctorById",
    "title": "Get doctor profile",
    "name": "doctorById",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is doctor id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/doctor-dashboard",
    "title": "doctor dashboard",
    "name": "doctor_dashboard",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is doctor profile id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/doctor-dashboard",
    "title": "doctor dashboard",
    "name": "doctor_dashboard",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is doctor profile id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/doctor-profiles",
    "title": "doctors filtering",
    "name": "doctor_profiles",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "name",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "email",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "mobile",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "selected_city",
            "description": "<p>optional id's are comma seperated</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "selected_specialization",
            "description": "<p>optional id's are comma seperated</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "languageId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/doctor-profiles",
    "title": "doctors filtering",
    "name": "doctor_profiles",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "name",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "email",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "mobile",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "selected_city",
            "description": "<p>optional id's are comma seperated</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "selected_specialization",
            "description": "<p>optional id's are comma seperated</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "languageId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/feedback/get-list",
    "title": "Get feedback list",
    "name": "feedback_list_api_for_doctor_app",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required doctorProfileId</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "type",
            "description": "<p>required for doctor app(value - 'all')</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "pageNo",
            "description": "<p>page number for pagination (optional)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "limit",
            "description": "<p>data limit (optional)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/feedback.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/filter_hospital-api",
    "title": "Filter hospital data",
    "name": "filter_hospital_api",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "name",
            "description": "<p>optional here name is hospital name</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "mobile",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "email",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "selected_city",
            "description": "<p>optional cities id's are comma seperated like (1,2,3,4)</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "logged_doctorprofile_id",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "page",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/filter_hospital-api",
    "title": "Filter hospital data",
    "name": "filter_hospital_api",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "name",
            "description": "<p>optional here name is hospital name</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "mobile",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "email",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "selected_city",
            "description": "<p>optional cities id's are comma seperated like (1,2,3,4)</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "logged_doctorprofile_id",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "page",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/register",
    "title": "doctor registration",
    "name": "register",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "roleId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "email",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "mobile",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "password",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "user_type",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "agreed_to_terms",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/saveDoctorEducation",
    "title": "Save Education details",
    "name": "saveDoctorEducation",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "college_name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "year_of_passing",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "tagtypeId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "edu_proof",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/saveDoctorRegistration",
    "title": "Save Registration details",
    "name": "saveDoctorRegistration",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>optional (doctor registration id)</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "council_registration_number",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "council_name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "year_of_registration",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "reg_proof",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/article/save-article",
    "title": "save/update article",
    "name": "save_article_api_for_doctor_app",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>Article ID(required in case of update, otherwise send blank value)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "Array",
            "optional": false,
            "field": "article_tags",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "title",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "article_body",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "keyId",
            "description": "<p>required doctorProfileId</p>"
          },
          {
            "group": "Parameter",
            "type": "File",
            "optional": false,
            "field": "article_image",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "status",
            "description": "<p>required(0 - Publish, 3 - Draft)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor/article.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/save_doctor_time-api",
    "title": "add doctor timing",
    "name": "save_doctor_time_api",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "consultation_charge",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "appointment_duration",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "hospitalId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "available_on_req",
            "description": "<p>optional (false or true)</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "timers",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "description": "<p>timers data in a json format like ([{&quot;days&quot;:&quot;mon&quot;,&quot;shift_1_from_time&quot;: 1800,&quot;shift_1_to_time&quot;: 84600,&quot;shift_2_from_time&quot;: 14400,&quot;shift_2_to_time&quot;: 32400 },{ &quot;days&quot;: &quot;tue&quot;, &quot;shift_1_from_time&quot;: 1800,&quot;shift_1_to_time&quot;: 84600,&quot;shift_2_from_time&quot;: 12600,&quot;shift_2_to_time&quot;: 18000}])</p>",
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/save_doctor_time-api",
    "title": "add doctor timing",
    "name": "save_doctor_time_api",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "consultation_charge",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "appointment_duration",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "hospitalId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "available_on_req",
            "description": "<p>optional (false or true)</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "timers",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "description": "<p>timers data in a json format like ([{&quot;days&quot;:&quot;mon&quot;,&quot;shift_1_from_time&quot;: 1800,&quot;shift_1_to_time&quot;: 84600,&quot;shift_2_from_time&quot;: 14400,&quot;shift_2_to_time&quot;: 32400 },{ &quot;days&quot;: &quot;tue&quot;, &quot;shift_1_from_time&quot;: 1800,&quot;shift_1_to_time&quot;: 84600,&quot;shift_2_from_time&quot;: 12600,&quot;shift_2_to_time&quot;: 18000}])</p>",
    "version": "0.0.0",
    "filename": "routes/healthcare.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/send-claim-request-api",
    "title": "Send claim request",
    "name": "send_claim_request_api",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/doctor/send-claim-request-api",
    "title": "Send claim request",
    "name": "send_claim_request_api",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/healthcare/chat/messages-pagination",
    "title": "Get chat messages",
    "group": "HealthcareChat",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "healthcareprofileId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "limit",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "offset",
            "optional": false,
            "field": "offset",
            "description": "<p>optional</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Obeject[]",
            "optional": false,
            "field": "data",
            "description": "<p>messages</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "count",
            "description": "<p>number of total messages</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare/chat.js",
    "groupTitle": "HealthcareChat",
    "name": "PostHealthcareChatMessagesPagination"
  },
  {
    "type": "post",
    "url": "/healthcare/chat/patient-list",
    "title": "Get chat list",
    "group": "HealthcareChat",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Obeject[]",
            "optional": false,
            "field": "data",
            "description": "<p>messages</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare/chat.js",
    "groupTitle": "HealthcareChat",
    "name": "PostHealthcareChatPatientList"
  },
  {
    "type": "post",
    "url": "/hospital/hospitalById",
    "title": "Get hospital profile",
    "name": "hospitalById",
    "group": "Hospital",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is hospital id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/hospital.js",
    "groupTitle": "Hospital"
  },
  {
    "type": "post",
    "url": "/medical_records/create",
    "title": "Create medical records",
    "name": "create",
    "group": "Medical",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "Date",
            "optional": false,
            "field": "date",
            "description": "<p>required yyyy-mm-dd</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "medical_record_type",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "img",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "title",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/medical_records.js",
    "groupTitle": "Medical"
  },
  {
    "type": "post",
    "url": "/medical_records/delete",
    "title": "Delete records",
    "name": "delete",
    "group": "Medical",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is medical_record_id</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/medical_records.js",
    "groupTitle": "Medical"
  },
  {
    "type": "post",
    "url": "/medical_records/deleteItem",
    "title": "Delete records items",
    "name": "deleteItem",
    "group": "Medical",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is medical record item</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/medical_records.js",
    "groupTitle": "Medical"
  },
  {
    "type": "post",
    "url": "/medical_records/getById",
    "title": "Get medical record by Id",
    "name": "getById",
    "group": "Medical",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is medical record id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/medical_records.js",
    "groupTitle": "Medical"
  },
  {
    "type": "post",
    "url": "/medical_records",
    "title": "Get medical records",
    "name": "medical_records",
    "group": "Medical",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/medical_records.js",
    "groupTitle": "Medical"
  },
  {
    "type": "get",
    "url": "/admin/add_to_cart",
    "title": "Add to cart list",
    "name": "add_to_cart",
    "group": "Medicine",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "medicineId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "qty",
            "description": "<p>Required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "prescription_image",
            "description": "<p>Optional</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/medicine.js",
    "groupTitle": "Medicine"
  },
  {
    "type": "get",
    "url": "/admin/cart_list",
    "title": "Patient Cart list",
    "name": "cart_list",
    "group": "Medicine",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/medicine.js",
    "groupTitle": "Medicine"
  },
  {
    "type": "get",
    "url": "/admin/medicine",
    "title": "Search List Of Medicines",
    "name": "medicine",
    "group": "Medicine",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "medicinedetail__title",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/medicine.js",
    "groupTitle": "Medicine"
  },
  {
    "type": "post",
    "url": "/admin/notification/setNotificationStatus",
    "title": "Notification Change Status",
    "name": "Notification_Change_Status",
    "group": "Notification",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "notificationId",
            "description": "<p>required In case of multiple(ex: 1,2,3)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "receiverId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "notification_status",
            "description": "<p>required 0=&gt;Unread, 1=&gt;Viewed, 2=&gt;Hide</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/notification.js",
    "groupTitle": "Notification"
  },
  {
    "type": "post",
    "url": "/admin/notification?page=1",
    "title": "Notification list",
    "name": "Notification_list",
    "group": "Notification",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/notification.js",
    "groupTitle": "Notification"
  },
  {
    "type": "post",
    "url": "/admin/notification/unread-count",
    "title": "Notification unread count",
    "name": "Notification_unread_count",
    "group": "Notification",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "receiverId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/notification.js",
    "groupTitle": "Notification"
  },
  {
    "type": "post",
    "url": "/patient/change-notification-setting",
    "title": "Change notification settings for patient app",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "type",
            "description": "<p>required ('is_chat_notification' || 'is_appointment_notification' || 'all') any one of them</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "value",
            "description": "<p>value to be updated(0, 1)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient",
    "name": "PostPatientChangeNotificationSetting"
  },
  {
    "type": "post",
    "url": "/users/register/add",
    "title": "Patient signup",
    "name": "add",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "mobile",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "phone_code",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "roleId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user_type",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "device_id",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "device_type",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/add_question",
    "title": "patient ask question",
    "name": "add_question",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "tagId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "age",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "gender",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "contact",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "patient_name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "problem_title",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "description",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "image",
            "description": "<p>optional</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/addtag",
    "title": "add patient tags",
    "name": "addtag",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "tagtypeId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "tagId",
            "description": "<p>required tagId should be in comma's sepetate like (23,45,78)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/check-favourite",
    "title": "Check favourite doctor",
    "name": "check_favourite",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/filter_records",
    "title": "data searching",
    "name": "filter_records",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "title",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "pageNo",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "limit",
            "description": "<p>optional</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/getByLocation",
    "title": "get hospitals/doctors by location",
    "name": "getByLocation",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "cityId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "tagId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "consultation_charge",
            "description": "<p>optional send string like (0-100)</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "gender",
            "description": "<p>optional send string like (male or female)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "online_booking",
            "description": "<p>optional set value 1</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/doctor/get-city-name-from-lat-long",
    "title": "Get city name from lat-long",
    "name": "get_city_name_from_lat_long",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "lat",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "long",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/doctor/get-city-name-from-lat-long",
    "title": "Get city name from lat-long",
    "name": "get_city_name_from_lat_long",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "lat",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "long",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/healthcare.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/make-favourite-doctor",
    "title": "Make favourite doctor",
    "name": "make_favourite_doctor",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "doctorProfileId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/my-doctors",
    "title": "get favourite doctor",
    "name": "my_doctors",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/users/patient-profile-data",
    "title": "Get patient data",
    "name": "patient_profile_data",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/questiondetail",
    "title": "patient question detail",
    "name": "questiondetail",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is patient question id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/questionlist",
    "title": "patient ask question list",
    "name": "questionlist",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "page",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/save",
    "title": "patinet save",
    "name": "save",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "countryId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "stateId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "cityId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "address",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "gender",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "zipcode",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "marital_status",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "blood_group",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "height_feet",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "height_inch",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "weight",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "emergency_contact",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "dob",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "current_medication",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "past_medication",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/users/update-profile",
    "title": "Update profile picture",
    "name": "update_profile",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here 'id' is userId</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user_image",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/users/userupdate",
    "title": "User update",
    "name": "userupdate",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here 'id' is userId</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "mobile",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/admin/tag/tagsbyType",
    "title": "Get tags by tagTypeId",
    "name": "tagsbyType",
    "group": "Tag",
    "description": "<p>{tagTypeId: 21, label: &quot;Medical record type&quot;} {tagTypeId: 20, label: &quot;Cigarette you smoke perday&quot;} {tagTypeId: 19, label: &quot;Alchoal Consumption&quot;} {tagTypeId: 18, label: &quot;Lifestyle&quot;} {tagTypeId: 17, label: &quot;Food Preference&quot;} {tagTypeId: 16, label: &quot;Occupation&quot;} {tagTypeId: 15, label: &quot;Surgeries&quot;} {tagTypeId: 14, label: &quot;Injuries&quot;} {tagTypeId: 13, label: &quot;Allergies&quot;} {tagTypeId: 12, label: &quot;Memberships&quot;} {tagTypeId: 11, label: &quot;Insurance Companies&quot;} {tagTypeId: 10, label: &quot;Problem Type&quot;} {tagTypeId: 9, label: &quot;SYMPTOMS for Doctors Clinic search&quot;} {tagTypeId: 8, label: &quot;Article Health Intrest Topics&quot;} {tagTypeId: 7, label: &quot;Chronic Disease&quot;} {tagTypeId: 6, label: &quot;Membership Councils&quot;} {tagTypeId: 5, label: &quot;Registration Council&quot;} {tagTypeId: 4, label: &quot;Education Colleage/University&quot;} {tagTypeId: 3, label: &quot;Education Qualification&quot;} {tagTypeId: 2, label: &quot;Specializations&quot;} {tagTypeId: 1, label: &quot;Services&quot;}</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is tagTeypeId (above json shows all tagTypeId and their label)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required (Only for doctor app)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/category.js",
    "groupTitle": "Tag"
  },
  {
    "type": "post",
    "url": "/admin/tag/tagsbyType",
    "title": "Get tags by tagTypeId",
    "name": "tagsbyType",
    "group": "Tag",
    "description": "<p>{tagTypeId: 21, label: &quot;Medical record type&quot;} {tagTypeId: 20, label: &quot;Cigarette you smoke perday&quot;} {tagTypeId: 19, label: &quot;Alchoal Consumption&quot;} {tagTypeId: 18, label: &quot;Lifestyle&quot;} {tagTypeId: 17, label: &quot;Food Preference&quot;} {tagTypeId: 16, label: &quot;Occupation&quot;} {tagTypeId: 15, label: &quot;Surgeries&quot;} {tagTypeId: 14, label: &quot;Injuries&quot;} {tagTypeId: 13, label: &quot;Allergies&quot;} {tagTypeId: 12, label: &quot;Memberships&quot;} {tagTypeId: 11, label: &quot;Insurance Companies&quot;} {tagTypeId: 10, label: &quot;Problem Type&quot;} {tagTypeId: 9, label: &quot;SYMPTOMS for Doctors Clinic search&quot;} {tagTypeId: 8, label: &quot;Article Health Intrest Topics&quot;} {tagTypeId: 7, label: &quot;Chronic Disease&quot;} {tagTypeId: 6, label: &quot;Membership Councils&quot;} {tagTypeId: 5, label: &quot;Registration Council&quot;} {tagTypeId: 4, label: &quot;Education Colleage/University&quot;} {tagTypeId: 3, label: &quot;Education Qualification&quot;} {tagTypeId: 2, label: &quot;Specializations&quot;} {tagTypeId: 1, label: &quot;Services&quot;}</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is tagTeypeId (above json shows all tagTypeId and their label)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required (Only for doctor app)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/tag.js",
    "groupTitle": "Tag"
  },
  {
    "type": "post",
    "url": "/admin/tag/tagsbyType",
    "title": "Get tags by tagTypeId",
    "name": "tagsbyType",
    "group": "Tag",
    "description": "<p>{tagTypeId: 21, label: &quot;Medical record type&quot;} {tagTypeId: 20, label: &quot;Cigarette you smoke perday&quot;} {tagTypeId: 19, label: &quot;Alchoal Consumption&quot;} {tagTypeId: 18, label: &quot;Lifestyle&quot;} {tagTypeId: 17, label: &quot;Food Preference&quot;} {tagTypeId: 16, label: &quot;Occupation&quot;} {tagTypeId: 15, label: &quot;Surgeries&quot;} {tagTypeId: 14, label: &quot;Injuries&quot;} {tagTypeId: 13, label: &quot;Allergies&quot;} {tagTypeId: 12, label: &quot;Memberships&quot;} {tagTypeId: 11, label: &quot;Insurance Companies&quot;} {tagTypeId: 10, label: &quot;Problem Type&quot;} {tagTypeId: 9, label: &quot;SYMPTOMS for Doctors Clinic search&quot;} {tagTypeId: 8, label: &quot;Article Health Intrest Topics&quot;} {tagTypeId: 7, label: &quot;Chronic Disease&quot;} {tagTypeId: 6, label: &quot;Membership Councils&quot;} {tagTypeId: 5, label: &quot;Registration Council&quot;} {tagTypeId: 4, label: &quot;Education Colleage/University&quot;} {tagTypeId: 3, label: &quot;Education Qualification&quot;} {tagTypeId: 2, label: &quot;Specializations&quot;} {tagTypeId: 1, label: &quot;Services&quot;}</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is tagTeypeId (above json shows all tagTypeId and their label)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required (Only for doctor app)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/medicine.js",
    "groupTitle": "Tag"
  },
  {
    "type": "post",
    "url": "/admin/tag/tagtypes",
    "title": "Get tagType list",
    "name": "tagtypes",
    "group": "Tag",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/medicine.js",
    "groupTitle": "Tag"
  },
  {
    "type": "post",
    "url": "/admin/tag/tagtypes",
    "title": "Get tagType list",
    "name": "tagtypes",
    "group": "Tag",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/tag.js",
    "groupTitle": "Tag"
  },
  {
    "type": "post",
    "url": "/admin/tag/tagtypes",
    "title": "Get tagType list",
    "name": "tagtypes",
    "group": "Tag",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/category.js",
    "groupTitle": "Tag"
  }
] });
