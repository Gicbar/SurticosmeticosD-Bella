import Swal from "sweetalert2"

// Colores del tema SurtiCosméticos D'Bella
const THEME_COLORS = {
  primary: "#B56B9E",      // Malva principal
  success: "#4EC4A8",      // Verde menta (chart-4)
  error: "#D14D3A",        // Rojo suave (destructive)
  warning: "#E6C158",      // Dorado (accent/chart-2)
  info: "#B56B9E",         // Malva para info
  cancel: "#A8A29E",       // Gris neutro (muted)
}

// Base de clases para estilos consistentes
const baseSwalConfig = {
  customClass: {
    container: "swal-container-high",
    popup: "rounded-xl backdrop-blur-md bg-card/90 border border-border/30 shadow-2xl",
    title: "text-foreground font-semibold text-lg",
    htmlContainer: "text-muted-foreground text-sm",
    confirmButton: "bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4 py-2 rounded-md transition-colors",
    cancelButton: "bg-muted text-muted-foreground hover:bg-muted/80 font-medium px-4 py-2 rounded-md transition-colors",
    icon: "my-2",
  },
  buttonsStyling: false, // Deshabilita estilos por defecto para usar clases custom
  heightAuto: false, // Previene saltos de altura
}

export const showSuccess = (message: string, title = "¡Éxito!") => {
  return Swal.fire({
    ...baseSwalConfig,
    icon: "success",
    iconColor: THEME_COLORS.success,
    title,
    text: message,
    confirmButtonText: "Aceptar",
    confirmButtonAriaLabel: "Aceptar",
    showConfirmButton: true,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer)
      toast.addEventListener("mouseleave", Swal.resumeTimer)
    },
  }).then((result) => {
    if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
      // Asegura que no haya modales bloqueando
      setTimeout(() => {
        document.body.style.overflow = ""
      }, 100)
    }
  })
}

export const showError = (message: string, title = "Error") => {
  return Swal.fire({
    ...baseSwalConfig,
    icon: "error",
    iconColor: THEME_COLORS.error,
    title,
    text: message,
    confirmButtonText: "Entendido",
    confirmButtonAriaLabel: "Entendido",
    showConfirmButton: true,
  }).then(() => {
    // Limpieza de estilos
    setTimeout(() => {
      document.body.style.overflow = ""
    }, 100)
  })
}

export const showWarning = (message: string, title = "Advertencia") => {
  return Swal.fire({
    ...baseSwalConfig,
    icon: "warning",
    iconColor: THEME_COLORS.warning,
    title,
    text: message,
    confirmButtonText: "Aceptar",
    confirmButtonAriaLabel: "Aceptar",
  })
}

export const showConfirm = async (message: string, title = "¿Estás seguro?") => {
  const result = await Swal.fire({
    ...baseSwalConfig,
    icon: "question",
    iconColor: THEME_COLORS.primary,
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    focusCancel: true,
  })
  return result.isConfirmed
}

export const showInfo = (message: string, title = "Información") => {
  return Swal.fire({
    ...baseSwalConfig,
    icon: "info",
    iconColor: THEME_COLORS.info,
    title,
    text: message,
    confirmButtonText: "Aceptar",
    timer: 4000,
    timerProgressBar: true,
  })
}

export const showInput = async (title: string, placeholder: string, inputType: "text" | "number" = "text") => {
  const result = await Swal.fire({
    ...baseSwalConfig,
    title,
    input: inputType,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    inputValidator: (value) => {
      if (!value) {
        return "Este campo es requerido"
      }
      return null
    },
  })
  return result.isConfirmed ? result.value : null
}