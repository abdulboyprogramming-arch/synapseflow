import React from 'react'
import Card from './Card'
import Badge from './Badge'
import { Project } from '../types'

interface Props {
  project: Project
}

const ProjectCard: React.FC<Props> = ({ project }) => {
  return (
    <Card className="hover:-translate-y-2 transition-transform duration-300">
      <h3 className="text-xl font-semibold gradient-text mb-2">
        {project.title}
      </h3>

      <p className="text-gray-400 text-sm line-clamp-3 mb-4">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {project.techStack?.slice(0, 3).map((tech) => (
          <Badge key={tech} variant="primary">
            {tech}
          </Badge>
        ))}
      </div>
    </Card>
  )
}

export default ProjectCard
