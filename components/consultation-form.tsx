"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { onSnapshot, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ConsultationFormProps {
  isLoading?: boolean
  consultation?: any
  onClose: () => void
  onSave: (consultation: any) => void
  currentUser?: any
}

export function ConsultationForm({ consultation, onClose, onSave, currentUser, isLoading }: ConsultationFormProps) {
  const [formData, setFormData] = useState({
    employeNom: consultation?.employeNom || "",
    employeMatricule: consultation?.employeMatricule || "",
    employeId: consultation?.employeId || "",
    medicinNom: consultation?.medicinNom || "",
    medecinId: currentUser?.id || consultation?.medecinId || "",
    date: consultation?.date || "",
    lieu: consultation?.lieu || "",
    diagnostic: consultation?.diagnostic || "",
    traitement: consultation?.traitement || "",
    observations: consultation?.observations || "",
    reposAccorde: consultation?.repos?.accorde || false,
    dureeRepos: consultation?.repos?.duree?.toString() || "",
    dateDebutRepos: consultation?.repos?.dateDebut || "",
    dateFinRepos: consultation?.repos?.dateFin || "",
    motif: consultation?.repos?.motif || "",
  })
  const [openEmployee, setOpenEmployee] = useState(false)

  const [employees, setEmployees] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, "employees"), (snapshot) => {
      setEmployees(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubDoctors = onSnapshot(collection(db, "doctors"), (snapshot) => {
      setDoctors(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubEmployees();
      unsubDoctors();
    };
  }, []);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!consultation) {

      const newConsultation = {
        employeId: formData.employeId,
        medecinId: formData.medecinId,
        medicinNom: formData.medicinNom,
        employeNom: formData.employeNom,
        employeMatricule: formData.employeMatricule,
        date: formData.date,
        lieu: formData.lieu,
        diagnostic: formData.diagnostic,
        traitement: formData.traitement,
        observations: formData.observations,
        repos: {
          accorde: formData.reposAccorde,
          motif: formData.reposAccorde ? formData.motif : "",
          duree: formData.reposAccorde ? Number.parseInt(formData.dureeRepos) : 0,
          dateDebut: formData.reposAccorde ? formData.dateDebutRepos : "",
          dateFin: formData.reposAccorde ? formData.dateFinRepos : "",
        },
      }

      onSave(newConsultation)
    } else {
      const updatedConsultation = {
        ...consultation,
        employeId: formData.employeId,
        medecinId: formData.medecinId,
        medicinNom: formData.medicinNom,
        employeNom: formData.employeNom,
        employeMatricule: formData.employeMatricule,
        date: formData.date,
        lieu: formData.lieu,
        diagnostic: formData.diagnostic,
        traitement: formData.traitement,
        observations: formData.observations,
        repos: {
          accorde: formData.reposAccorde,
          motif: formData.reposAccorde ? formData.motif : "",
          duree: formData.reposAccorde ? Number.parseInt(formData.dureeRepos) : 0,
          dateDebut: formData.reposAccorde ? formData.dateDebutRepos : "",
          dateFin: formData.reposAccorde ? formData.dateFinRepos : "",
        },
      }
      
      onSave(updatedConsultation)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employee">Employé</Label>
          <Popover open={openEmployee} onOpenChange={setOpenEmployee}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between",
                  !formData.employeId && "text-muted-foreground"
                )}
              >
                {formData.employeId
                  ? (() => {
                    const emp = employees.find((e) => e.id === formData.employeId);
                    return emp
                      ? `${emp.prenom} ${emp.nom} (${emp.matricule})`
                      : "Sélectionner un employé";
                  })()
                  : "Sélectionner un employé"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Rechercher un employé..." />
                <CommandList>
                  <CommandEmpty>Aucun résultat.</CommandEmpty>
                  <CommandGroup>
                    {employees.map((emp) => (
                      <CommandItem
                        key={emp.id}
                        value={`${emp.prenom} ${emp.nom} (${emp.matricule})`}
                        onSelect={() => {
                          setFormData({
                            ...formData,
                            employeId: emp.id,
                            employeNom: `${emp.prenom} ${emp.nom}`,
                            employeMatricule: emp.matricule || "",
                          });
                          setOpenEmployee(false);
                        }}
                      >
                        {emp.prenom} {emp.nom} ({emp.matricule})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="mb-4">
          <Label htmlFor="medecin">Médecin</Label>
          <Select value={formData.medecinId} onValueChange={(value) => setFormData({
            ...formData,
            medecinId: value,
            medicinNom: `Dr. ${doctors.find(doc => doc.id === value)?.prenom} ${doctors.find(doc => doc.id === value)?.nom}`
           })}
           required
           >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un médecin" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  Dr. {doc.prenom} {doc.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lieu">Lieu</Label>
          <Select
            value={formData.lieu}
            onValueChange={(value) => setFormData({ ...formData, lieu: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un lieu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cabinet">Cabinet</SelectItem>
              <SelectItem value="Port">Port</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="diagnostic">Diagnostic</Label>
          <Input
            id="diagnostic"
            type="text"
            value={formData.diagnostic}
            onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="traitement">Traitement</Label>
          <Input
            id="traitement"
            type="text"
            value={formData.traitement}
            onChange={(e) => setFormData({ ...formData, traitement: e.target.value })}
          />
        </div>
      </div>

      <div className="mb-4">
        <Label htmlFor="observations">Observations</Label>
        <Textarea
          id="observations"
          value={formData.observations}
          onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
          className="min-h-[60px] text-base"
        />
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="repos"
            checked={formData.reposAccorde}
            onCheckedChange={(checked) => setFormData({ ...formData, reposAccorde: checked as boolean })}
          />
          <Label htmlFor="repos">Accorder un repos</Label>
        </div>

        {formData.reposAccorde && (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dureeRepos">Durée (jours)</Label>
              <Input
                id="dureeRepos"
                type="number"
                value={formData.dureeRepos}
                onChange={(e) => setFormData({ ...formData, dureeRepos: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="dateDebutRepos">Date de début</Label>
              <Input
                id="dateDebutRepos"
                type="date"
                value={formData.dateDebutRepos}
                onChange={(e) => setFormData({ ...formData, dateDebutRepos: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="dateFinRepos">Date de fin</Label>
              <Input
                id="dateFinRepos"
                type="date"
                value={formData.dateFinRepos}
                onChange={(e) => setFormData({ ...formData, dateFinRepos: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <Label htmlFor="motif">Motif du repos</Label>
            <Textarea
              id="motif"
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              className="min-h-[60px] text-base"
              required
            />
          </div>
          </>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto bg-transparent" disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {consultation ? "Modifier" : "Enregistrer"}
        </Button>
      </div>
    </form>
  )
}
