import os, sys, argparse, numpy, h5py, tempfile, contextlib, convert

parser = argparse.ArgumentParser(description='handle input')
parser.add_argument('input', metavar='I', type=str, help='input')

args = parser.parse_args()

with open(args.input, 'r') as file:
  content = file.read()
  if content[0:8] == b'\x89HDF\r\n\x1a\n':
    file_access_property_list = h5py.h5p.create(h5py.h5p.FILE_ACCESS)
    file_access_property_list.set_fapl_core(backing_store=False)
    file_access_property_list.set_file_image(content)
    file_id_args = {
      'fapl': file_access_property_list,
      'flags': h5py.h5f.ACC_RDONLY,
      'name': next(tempfile._get_candidate_names()).encode(),
    }
    h5_file_args = {'backing_store': False, 'driver': 'core', 'mode': 'r'}
    with contextlib.closing(h5py.h5f.open(**file_id_args)) as file_id:
      with h5py.File(file_id, **h5_file_args) as h5_file:
        json = convert.tojson(h5_file)
        h5_file.close()
    print json
  else:
    print content

sys.exit()

# quit()
