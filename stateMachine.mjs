//const/stateMachine.mjs

// Import the ES module
import { getUserState, saveUserInfo, saveUserState, isAdmin, getUserInfo, getNameColumnValues } from '../utils/userManager.mjs';
import { menuDefault, menuAdmin, yesNoChurchMember, borrar } from '../const/contentId.mjs'
import { callLambdaForFirstMessage } from '../utils/executeLambda.mjs'


const transitions = {
  idle: "awaiting_name",
  awaiting_name: "awaiting_surname",
  awaiting_surname: "awaiting_age",
  awaiting_age: "awaiting_gender",
  awaiting_gender: "store_user_info",
  store_user_info: "idle",
  awaiting_datetime: "idle",
  yes: "awaiting_name", // Estado en caso de respuesta afirmativa
  no: "idle", // Estado en caso de respuesta negativa
};

export const userStateMachine = {
    idle: {
      triggers: ["provide_advisor_data", "ask_advisory_date", "cancel_advisory"],
      responses: {
        provide_advisor_data: {
          nextState: "answer_yes_or_no",
          response: "Hola, antes de continuar, necesitamos quisieramos saber ¿Asiste usted a casa sobre la roca?,",
          action: async (waId, userState) => {
            try {
              // Save the user information in a separate DynamoDB table
              await saveUserInfo(waId, userState.data);
              const emptyArray = [];
              await callLambdaForFirstMessage([waId],yesNoChurchMember);
            } catch (error) {
              console.error("Error saving user information:", error);
            }
          },
        },
        ask_advisory_date: {
          nextState: "awaiting_datetime",
          response: "Por favor, envía la fecha y hora para la reunión (Formato: AAAA-MM-DD HH:MM AM/PM).",
        },
        cancel_advisory: {
          nextState: "idle",
          response: "Por favor, proporciona el ID de la reunión que deseas cancelar.",
        },
      },
    },
  
    awaiting_name: {
      nextState: "awaiting_surname",
      successResponse: "Gracias, {name}. Ahora, envíame tu apellido.",
      failureResponse: "Por favor, proporciona un nombre válido.",
      validate: (message) => message && message.trim().length > 0,
    },
    awaiting_surname: {
      nextState: "awaiting_age",
      successResponse: "Gracias, {name} {surname}. Ahora, ¿cuál es tu edad?",
      failureResponse: "Por favor, proporciona un apellido válido.",
      validate: (message) => message && message.trim().length > 0,
    },
    awaiting_age: {
      nextState: "awaiting_gender",
      successResponse: "Perfecto. Ahora, ¿cuál es tu género? (Masculino, Femenino)",
      failureResponse: "Por favor, proporciona un genero valido.",
      validate: (message) => !isNaN(parseInt(message)) && parseInt(message) > 0,
    },
    awaiting_gender: {
      nextState: "idle",
      successResponse: "{name} Gracias por registrarte.",
      failureResponse: "Por favor, proporciona un género válido.",
      validate: (message) => message && message.trim().length > 0,
      action: async (waId, userState) => {
        try {
          // Save the user information in a separate DynamoDB table
          await saveUserInfo(waId, userState.data);
          await callLambdaForFirstMessage([waId],menuDefault);
          
        } catch (error) {
          console.error("Error saving user information:", error);
        }
      },
    },
    store_user_info: {
      nextState: "idle",
      response: "Tu información se ha guardado correctamente.",
      action: async (waId, userState) => {
        try {
          // Save the user information in a separate DynamoDB table
          await saveUserInfo(waId, userState.data);
        } catch (error) {
          console.error("Error saving user information:", error);
        }
      },
    },
    awaiting_datetime: {
      nextState: "idle",
      successResponse: "¡Gracias! Tu reunión ha sido programada para el {date} a las {time}.",
      failureResponse: "Por favor, proporciona una fecha y hora válida.",
      validate: (message) => parseDateTime(message),
    },
    answer_yes_or_no: {
      validate: (message) => ["sí", "si"].includes(message.toLowerCase().trim()),
      yesChurchResponse: "Gracias por confirmar. Vamos a continuar.\n\n¿Cuál es tu nombre?",	
      noChurchResponse: "Para recibir consejeria debe ser miembro de la iglesia",
      getNextState: (nextState) => {
        return transitions[nextState];
      },
    },
  };
