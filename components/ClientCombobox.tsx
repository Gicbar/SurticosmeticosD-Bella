"use client"
import { useState, useEffect, useRef } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Client {
  id: string
  name: string
}

interface ClientComboboxProps {
  clients: Client[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function ClientCombobox({ clients, value, onChange, placeholder = "Selecciona un cliente" }: ClientComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients)

  useEffect(() => {
    // Filtrar clientes según el valor de búsqueda
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchValue.toLowerCase())
    )
    setFilteredClients(filtered)
  }, [searchValue, clients])

  // Cuando se selecciona un cliente
  const handleSelect = (clientId: string) => {
    onChange(clientId)
    setOpen(false)
    setSearchValue("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11 border border-border bg-background rounded-lg"
        >
          {value
            ? clients.find((client) => client.id === value)?.name
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0 bg-white dark:bg-[#1e1e1e] border-border rounded-lg shadow-lg"
        style={{ zIndex: 10000 }}
      >
        <Command>
          <CommandInput
            placeholder="Buscar cliente..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No se encontró el cliente</CommandEmpty>
            <CommandGroup>
              {filteredClients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => handleSelect(client.id)}
                  className="cursor-pointer hover:bg-secondary/20"
                  style={{
                    backgroundColor: value === client.id ? 'var(--secondary/20)' : '',
                    padding: '8px 12px'
                  }}
                >
                  {client.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
